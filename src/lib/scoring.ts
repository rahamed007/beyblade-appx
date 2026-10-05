import { and, eq } from "drizzle-orm";
import { inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { matches, players, registrations } from "@/db/schema";

/**
 * Recomputes bladers' lifetime records from every completed match.
 * Called after a match is created, scored or deleted so standings stay honest.
 */
export async function recomputePlayerRecords(
  playerIds: Array<number | null | undefined>,
): Promise<void> {
  const ids = Array.from(
    new Set(playerIds.filter((id): id is number => typeof id === "number")),
  );
  if (!ids.length) return;

  const rows = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.status, "completed"),
        or(inArray(matches.playerAId, ids), inArray(matches.playerBId, ids)),
      ),
    );

  const stats = new Map<
    number,
    { wins: number; losses: number; bw: number; bl: number; pts: number }
  >();
  ids.forEach((id) => stats.set(id, { wins: 0, losses: 0, bw: 0, bl: 0, pts: 0 }));

  for (const m of rows) {
    const a = stats.get(m.playerAId);
    const b = stats.get(m.playerBId);
    if (a) {
      a.bw += m.battlesA;
      a.bl += m.battlesB;
      a.pts += m.scoreA;
      if (m.winnerId === m.playerAId) a.wins += 1;
      else if (m.winnerId) a.losses += 1;
    }
    if (b) {
      b.bw += m.battlesB;
      b.bl += m.battlesA;
      b.pts += m.scoreB;
      if (m.winnerId === m.playerBId) b.wins += 1;
      else if (m.winnerId) b.losses += 1;
    }
  }

  await Promise.all(
    Array.from(stats.entries()).map(([id, value]) =>
      db
        .update(players)
        .set({
          wins: value.wins,
          losses: value.losses,
          battleWins: value.bw,
          battleLosses: value.bl,
          points: value.pts,
        })
        .where(eq(players.id, id)),
    ),
  );
}

export type StandingRow = {
  playerId: number;
  bladerName: string;
  team: string | null;
  region: string | null;
  seed: number;
  status: string;
  deckSize: number;
  matchesPlayed: number;
  matchWins: number;
  matchLosses: number;
  battleWins: number;
  battleLosses: number;
  matchPoints: number;
  pointsAllowed: number;
  diff: number;
};

export async function computeStandings(tournamentId: number): Promise<StandingRow[]> {
  const roster = await db
    .select({
      playerId: players.id,
      bladerName: players.bladerName,
      team: players.team,
      region: players.region,
      seed: registrations.seed,
      status: registrations.status,
      deckSize: registrations.deck,
    })
    .from(registrations)
    .innerJoin(players, eq(registrations.playerId, players.id))
    .where(eq(registrations.tournamentId, tournamentId));

  const played = await db
    .select()
    .from(matches)
    .where(and(eq(matches.tournamentId, tournamentId), eq(matches.status, "completed")));

  const rows: StandingRow[] = roster.map((entry) => ({
    playerId: entry.playerId,
    bladerName: entry.bladerName,
    team: entry.team,
    region: entry.region,
    seed: entry.seed,
    status: entry.status,
    deckSize: Array.isArray(entry.deckSize) ? entry.deckSize.length : 0,
    matchesPlayed: 0,
    matchWins: 0,
    matchLosses: 0,
    battleWins: 0,
    battleLosses: 0,
    matchPoints: 0,
    pointsAllowed: 0,
    diff: 0,
  }));

  const byId = new Map(rows.map((r) => [r.playerId, r]));

  for (const m of played) {
    const a = byId.get(m.playerAId);
    const b = byId.get(m.playerBId);
    if (a) {
      a.matchesPlayed += 1;
      a.battleWins += m.battlesA;
      a.battleLosses += m.battlesB;
      a.matchPoints += m.scoreA;
      a.pointsAllowed += m.scoreB;
      if (m.winnerId === m.playerAId) a.matchWins += 1;
      else if (m.winnerId) a.matchLosses += 1;
    }
    if (b) {
      b.matchesPlayed += 1;
      b.battleWins += m.battlesB;
      b.battleLosses += m.battlesA;
      b.matchPoints += m.scoreB;
      b.pointsAllowed += m.scoreA;
      if (m.winnerId === m.playerBId) b.matchWins += 1;
      else if (m.winnerId) b.matchLosses += 1;
    }
  }

  rows.forEach((r) => {
    r.diff = r.matchPoints - r.pointsAllowed;
  });

  return rows.sort(
    (x, y) =>
      y.matchWins - x.matchWins ||
      y.diff - x.diff ||
      y.matchPoints - x.matchPoints ||
      x.seed - y.seed,
  );
}
