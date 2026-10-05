import { sql } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { badRequest, json, optionalStr, readJson, str, withUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export type MatchRow = {
  id: number;
  tournamentId: number;
  tournamentName: string;
  matchType: string;
  round: number;
  tableNumber: number;
  playerAId: number;
  playerBId: number;
  playerAName: string;
  playerBName: string;
  scoreA: number;
  scoreB: number;
  battlesA: number;
  battlesB: number;
  winnerId: number | null;
  finishType: string | null;
  status: string;
  playedAt: string | null;
  notes: string | null;
};

export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const url = new URL(request.url);
    const tournamentId = url.searchParams.get("tournamentId");
    const status = url.searchParams.get("status");

    const result = await db.execute<{
      id: number;
      tournament_id: number;
      tournament_name: string;
      match_type: string;
      round: number;
      table_number: number;
      player_a_id: number;
      player_b_id: number;
      player_a_name: string;
      player_b_name: string;
      score_a: number;
      score_b: number;
      battles_a: number;
      battles_b: number;
      winner_id: number | null;
      finish_type: string | null;
      status: string;
      played_at: string | null;
      notes: string | null;
    }>(sql`
      select
        m.id, m.tournament_id, t.name as tournament_name, t.match_type,
        m.round, m.table_number, m.player_a_id, m.player_b_id,
        pa.blader_name as player_a_name, pb.blader_name as player_b_name,
        m.score_a, m.score_b, m.battles_a, m.battles_b,
        m.winner_id, m.finish_type, m.status, m.played_at, m.notes
      from matches m
      join tournaments t on t.id = m.tournament_id
      join players pa on pa.id = m.player_a_id
      join players pb on pb.id = m.player_b_id
      where (${tournamentId ? sql`m.tournament_id = ${Number(tournamentId)}` : sql`true`})
        and (${status ? sql`m.status = ${status}` : sql`true`})
      order by m.tournament_id desc, m.round asc, m.table_number asc, m.id asc
      limit 300
    `);

    const list: MatchRow[] = result.rows.map((r) => ({
      id: r.id,
      tournamentId: r.tournament_id,
      tournamentName: r.tournament_name,
      matchType: r.match_type,
      round: r.round,
      tableNumber: r.table_number,
      playerAId: r.player_a_id,
      playerBId: r.player_b_id,
      playerAName: r.player_a_name,
      playerBName: r.player_b_name,
      scoreA: r.score_a,
      scoreB: r.score_b,
      battlesA: r.battles_a,
      battlesB: r.battles_b,
      winnerId: r.winner_id,
      finishType: r.finish_type,
      status: r.status,
      playedAt: r.played_at ? new Date(r.played_at).toISOString() : null,
      notes: r.notes,
    }));

    return json({ matches: list });
  } catch (error) {
    console.error(error);
    return json({ matches: [], error: "Failed to load matches" }, 500);
  }
}

type MatchBody = {
  tournamentId?: number;
  round?: number;
  tableNumber?: number;
  playerAId?: number;
  playerBId?: number;
  status?: string;
  notes?: string;
};

export async function POST(request: Request) {
  return withUser(async () => {
    const body = await readJson<MatchBody>(request);
    const tournamentId = Number(body.tournamentId) || 0;
    const playerAId = Number(body.playerAId) || 0;
    const playerBId = Number(body.playerBId) || 0;
    if (!tournamentId) return badRequest("Pick a tournament for this match.");
    if (!playerAId || !playerBId) return badRequest("Two bladers are required.");
    if (playerAId === playerBId)
      return badRequest("A blader cannot face themselves.");

    const [created] = await db
      .insert(matches)
      .values({
        tournamentId,
        round: Math.max(1, Number(body.round) || 1),
        tableNumber: Math.max(1, Number(body.tableNumber) || 1),
        playerAId,
        playerBId,
        status: str(body.status, "scheduled"),
        notes: optionalStr(body.notes),
      })
      .returning();
    return json({ match: created }, 201);
  });
}


