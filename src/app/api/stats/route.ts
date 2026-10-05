import { asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { matches, players, registrations, tournaments } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();

    const [counts] = await db
      .select({
        tournaments: sql<number>`(select count(*)::int from ${tournaments})`,
        liveTournaments: sql<number>`(select count(*)::int from ${tournaments} where status = 'live')`,
        players: sql<number>`(select count(*)::int from ${players})`,
        matchesPlayed: sql<number>`(select count(*)::int from ${matches} where status = 'completed')`,
        upcoming: sql<number>`(select count(*)::int from ${matches} where status = 'scheduled')`,
        entrants: sql<number>`(select count(*)::int from ${registrations})`,
      })
      .from(sql`(select 1) as one`);

    const activeTournaments = await db
      .select()
      .from(tournaments)
      .where(sql`${tournaments.status} in ('live','registration')`)
      .orderBy(asc(tournaments.startsAt))
      .limit(3);

    const recentMatches = await db
      .select({
        id: matches.id,
        tournamentName: tournaments.name,
        round: matches.round,
        status: matches.status,
        scoreA: matches.scoreA,
        scoreB: matches.scoreB,
        finishType: matches.finishType,
        winnerId: matches.winnerId,
        playerAId: matches.playerAId,
        playerBId: matches.playerBId,
        playerAName: sql<string>`(select blader_name from players where id = ${matches.playerAId})`,
        playerBName: sql<string>`(select blader_name from players where id = ${matches.playerBId})`,
      })
      .from(matches)
      .innerJoin(tournaments, eq(matches.tournamentId, tournaments.id))
      .orderBy(desc(matches.updatedAt))
      .limit(6);

    const leaders = await db
      .select({
        id: players.id,
        bladerName: players.bladerName,
        team: players.team,
        region: players.region,
        wins: players.wins,
        losses: players.losses,
        points: players.points,
        battleWins: players.battleWins,
        battleLosses: players.battleLosses,
      })
      .from(players)
      .orderBy(desc(players.wins), desc(players.points))
      .limit(5);

    const soon = new Date();
    soon.setDate(soon.getDate() + 45);
    const calendar = await db
      .select()
      .from(tournaments)
      .where(gte(tournaments.startsAt, new Date(Date.now() - 1000 * 60 * 60 * 24)))
      .orderBy(asc(tournaments.startsAt))
      .limit(4);

    return json({
      stats: {
        tournaments: counts?.tournaments ?? 0,
        liveTournaments: counts?.liveTournaments ?? 0,
        players: counts?.players ?? 0,
        matchesPlayed: counts?.matchesPlayed ?? 0,
        upcoming: counts?.upcoming ?? 0,
        entrants: counts?.entrants ?? 0,
      },
      activeTournaments,
      recentMatches,
      leaders,
      calendar,
    });
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to load dashboard" }, 500);
  }
}
