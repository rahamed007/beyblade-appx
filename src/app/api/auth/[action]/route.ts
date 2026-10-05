import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import {
  badRequest,
  json,
  readJson,
  serverError,
  str,
  unauthorized,
} from "@/lib/api";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  toSafeUser,
  verifyPassword,
} from "@/lib/auth";

type AuthBody = { email?: string; password?: string; name?: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  if (action !== "session") return unauthorized();
  const user = await getCurrentUser();
  return json({ user });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  try {
    if (action === "logout") {
      await destroySession();
      return json({ ok: true });
    }

    const body = await readJson<AuthBody>(request);
    const email = str(body.email).toLowerCase();
    const password = str(body.password);

    if (!email || !password) {
      return badRequest("Email and password are required.");
    }

    if (action === "register") {
      const name = str(body.name) || email.split("@")[0];
      if (password.length < 6) {
        return badRequest("Password must be at least 6 characters.");
      }
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing.length) {
        return badRequest("An account with that email already exists.");
      }
      const [created] = await db
        .insert(users)
        .values({ email, name, passwordHash: hashPassword(password), role: "organizer" })
        .returning();
      await createSession(created.id);
      return json({ user: toSafeUser(created) }, 201);
    }

    if (action === "login") {
      await ensureSeeded();
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!found || !verifyPassword(password, found.passwordHash)) {
        return Response.json(
          { error: "Incorrect email or password." },
          { status: 401 },
        );
      }
      await createSession(found.id);
      return json({ user: toSafeUser(found) });
    }

    return unauthorized();
  } catch (error) {
    return serverError(error);
  }
}
