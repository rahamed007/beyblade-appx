import { eq } from "drizzle-orm";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import type { DeckBey } from "@/db/schema";
import { badRequest, json, notFound, num, optionalStr, readJson, str, withUser } from "@/lib/api";
import { validateDeck } from "@/lib/rules";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const registrationId = num(id);
  return withUser(async () => {
    const body = await readJson<{
      seed?: number;
      status?: string;
      deck?: DeckBey[];
      notes?: string;
    }>(request);

    const [current] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, registrationId))
      .limit(1);
    if (!current) return notFound("Registration not found");

    const updates: Partial<typeof registrations.$inferInsert> = {};
    if (body.seed !== undefined) updates.seed = num(body.seed, current.seed);
    if (str(body.status)) updates.status = str(body.status, current.status);
    if ("notes" in body) updates.notes = optionalStr(body.notes);
    if (Array.isArray(body.deck)) {
      const errors = validateDeck(body.deck);
      if (errors.length) return badRequest(errors.join(" "));
      updates.deck = body.deck;
    }
    if (!Object.keys(updates).length) return badRequest("Nothing to update.");

    const [updated] = await db
      .update(registrations)
      .set(updates)
      .where(eq(registrations.id, registrationId))
      .returning();
    return json({ registration: updated });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const registrationId = num(id);
  return withUser(async () => {
    const [deleted] = await db
      .delete(registrations)
      .where(eq(registrations.id, registrationId))
      .returning({ id: registrations.id });
    if (!deleted) return notFound("Registration not found");
    return json({ ok: true, id: deleted.id });
  });
}
