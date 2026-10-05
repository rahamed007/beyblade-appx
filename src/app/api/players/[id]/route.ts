import { eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import {
  json,
  notFound,
  num,
  optionalStr,
  readJson,
  str,
  withUser,
} from "@/lib/api";

type PlayerBody = {
  bladerName?: string;
  realName?: string;
  region?: string;
  team?: string;
  launchStyle?: string;
  signatureMove?: string;
  bio?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const playerId = num(id);
  return withUser(async () => {
    const body = await readJson<PlayerBody>(request);
    const updates: Partial<typeof players.$inferInsert> = {};
    if (str(body.bladerName)) updates.bladerName = str(body.bladerName);
    if ("realName" in body) updates.realName = optionalStr(body.realName);
    if ("region" in body) updates.region = optionalStr(body.region);
    if ("team" in body) updates.team = optionalStr(body.team);
    if (str(body.launchStyle)) updates.launchStyle = str(body.launchStyle);
    if ("signatureMove" in body)
      updates.signatureMove = optionalStr(body.signatureMove);
    if ("bio" in body) updates.bio = optionalStr(body.bio);
    if (!Object.keys(updates).length) {
      const [current] = await db
        .select()
        .from(players)
        .where(eq(players.id, playerId))
        .limit(1);
      return current ? json({ player: current }) : notFound("Player not found");
    }

    const [updated] = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, playerId))
      .returning();
    if (!updated) return notFound("Player not found");
    return json({ player: updated });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const playerId = num(id);
  return withUser(async () => {
    const [deleted] = await db
      .delete(players)
      .where(eq(players.id, playerId))
      .returning({ id: players.id });
    if (!deleted) return notFound("Player not found");
    return json({ ok: true, id: deleted.id });
  });
}
