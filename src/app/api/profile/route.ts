import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { badRequest, json, readJson, serverError, str, withUser } from "@/lib/api";
import { hashPassword, toSafeUser, verifyPassword } from "@/lib/auth";

type ProfileBody = {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function PATCH(request: Request) {
  return withUser(async (user) => {
    try {
      const body = await readJson<ProfileBody>(request);
      const updates: Partial<typeof users.$inferInsert> = {};

      const name = str(body.name);
      if (name) updates.name = name;

      const email = str(body.email).toLowerCase();
      if (email && email !== user.email) {
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (existing.length && existing[0].id !== user.id) {
          return badRequest("That email is already in use.");
        }
        updates.email = email;
      }

      const newPassword = str(body.newPassword);
      if (newPassword) {
        const currentPassword = str(body.currentPassword);
        const [row] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);
        if (!row || !verifyPassword(currentPassword, row.passwordHash)) {
          return badRequest("Current password is incorrect.");
        }
        if (newPassword.length < 6) {
          return badRequest("New password must be at least 6 characters.");
        }
        updates.passwordHash = hashPassword(newPassword);
      }

      if (!Object.keys(updates).length) {
        return json({ user });
      }

      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, user.id))
        .returning();
      return json({ user: toSafeUser(updated) });
    } catch (error) {
      return serverError(error);
    }
  });
}
