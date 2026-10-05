import { eq } from "drizzle-orm";
import { db } from "@/db";
import { beyblades } from "@/db/schema";
import {
  badRequest,
  json,
  notFound,
  num,
  optionalStr,
  readJson,
  str,
  withUser,
} from "@/lib/api";

type BeyBody = {
  name?: string;
  blade?: string;
  ratchet?: string;
  bit?: string;
  type?: string;
  spin?: string;
  notes?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const beyId = num(id);
  return withUser(async () => {
    const body = await readJson<BeyBody>(request);
    const updates: Partial<typeof beyblades.$inferInsert> = {};
    if (str(body.name)) updates.name = str(body.name);
    if (str(body.blade)) updates.blade = str(body.blade);
    if (str(body.ratchet)) updates.ratchet = str(body.ratchet);
    if (str(body.bit)) updates.bit = str(body.bit);
    if (str(body.type)) updates.type = str(body.type);
    if (str(body.spin)) updates.spin = str(body.spin);
    if ("notes" in body) updates.notes = optionalStr(body.notes);
    if (!Object.keys(updates).length) return badRequest("Nothing to update.");

    const [updated] = await db
      .update(beyblades)
      .set(updates)
      .where(eq(beyblades.id, beyId))
      .returning();
    if (!updated) return notFound("Bey not found");
    return json({ beyblade: updated });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const beyId = num(id);
  return withUser(async () => {
    const [deleted] = await db
      .delete(beyblades)
      .where(eq(beyblades.id, beyId))
      .returning({ id: beyblades.id });
    if (!deleted) return notFound("Bey not found");
    return json({ ok: true, id: deleted.id });
  });
}
