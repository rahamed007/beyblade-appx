import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
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
import { FINISH_TYPES } from "@/lib/rules";
import { recomputePlayerRecords } from "@/lib/scoring";

type MatchBody = {
  round?: number;
  tableNumber?: number;
  playerAId?: number;
  playerBId?: number;
  scoreA?: number;
  scoreB?: number;
  battlesA?: number;
  battlesB?: number;
  winnerId?: number | null;
  finishType?: string | null;
  status?: string;
  notes?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const matchId = num(id);
  return withUser(async () => {
    const body = await readJson<MatchBody>(request);
    const [current] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);
    if (!current) return notFound("Match not found");

    const updates: Partial<typeof matches.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.round !== undefined) updates.round = Math.max(1, num(body.round, 1));
    if (body.tableNumber !== undefined)
      updates.tableNumber = Math.max(1, num(body.tableNumber, 1));
    if (body.playerAId !== undefined) updates.playerAId = num(body.playerAId);
    if (body.playerBId !== undefined) updates.playerBId = num(body.playerBId);
    if (body.scoreA !== undefined) updates.scoreA = Math.max(0, num(body.scoreA, 0));
    if (body.scoreB !== undefined) updates.scoreB = Math.max(0, num(body.scoreB, 0));
    if (body.battlesA !== undefined)
      updates.battlesA = Math.max(0, num(body.battlesA, 0));
    if (body.battlesB !== undefined)
      updates.battlesB = Math.max(0, num(body.battlesB, 0));
    if (str(body.status)) updates.status = str(body.status, current.status);
    if ("notes" in body) updates.notes = optionalStr(body.notes);

    const status = updates.status ?? current.status;
    if (status === "completed") {
      const finishType = str(body.finishType) || current.finishType || "survivor";
      if (!FINISH_TYPES.some((f) => f.value === finishType)) {
        return badRequest("Unknown finish type.");
      }
      updates.finishType = finishType;

      const winnerId =
        body.winnerId !== undefined && body.winnerId !== null
          ? num(body.winnerId)
          : current.winnerId;
      const scoreA = updates.scoreA ?? current.scoreA;
      const scoreB = updates.scoreB ?? current.scoreB;
      if (scoreA === scoreB) {
        updates.winnerId = null;
      } else if (winnerId) {
        updates.winnerId = winnerId;
      } else {
        updates.winnerId = scoreA > scoreB ? current.playerAId : current.playerBId;
      }
      updates.playedAt = current.playedAt ?? new Date();

      // Default the battle tally to the match-point split when the judge only
      // logs the final score.
      if (updates.battlesA === undefined && updates.battlesB === undefined) {
        const battles = current.battlesA + current.battlesB;
        if (battles === 0) {
          updates.battlesA = scoreA;
          updates.battlesB = scoreB;
        }
      }
    } else {
      updates.winnerId = body.winnerId ? num(body.winnerId) : null;
      updates.finishType = optionalStr(body.finishType);
      updates.playedAt = null;
    }

    const [updated] = await db
      .update(matches)
      .set(updates)
      .where(eq(matches.id, matchId))
      .returning();

    await recomputePlayerRecords([updated.playerAId, updated.playerBId]);
    return json({ match: updated });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const matchId = num(id);
  return withUser(async () => {
    const [deleted] = await db
      .delete(matches)
      .where(eq(matches.id, matchId))
      .returning();
    if (!deleted) return notFound("Match not found");
    await recomputePlayerRecords([deleted.playerAId, deleted.playerBId]);
    return json({ ok: true, id: deleted.id });
  });
}
