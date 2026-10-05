import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { registrations, matches, tournaments } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import {
  badRequest,
  json,
  optionalStr,
  readJson,
  str,
  withUser,
} from "@/lib/api";
import { MATCH_TYPES, TOURNAMENT_STATUSES, slugify } from "@/lib/rules";

export const dynamic = "force-dynamic";

type TournamentBody = {
  name?: string;
  description?: string;
  location?: string;
  format?: string;
  matchType?: string;
  maxPlayers?: number;
  status?: string;
  prizePool?: string;
  startsAt?: string;
};

export async function GET() {
  try {
    await ensureSeeded();
    const rows = await db
      .select({
        tournament: tournaments,
        entrants: sql<number>`(select count(*)::int from ${registrations} r where r.tournament_id = ${tournaments.id})`,
        matchCount: sql<number>`(select count(*)::int from ${matches} m where m.tournament_id = ${tournaments.id})`,
      })
      .from(tournaments)
      .orderBy(desc(tournaments.startsAt));

    const payload = rows.map((row) => ({
      ...row.tournament,
      entrants: row.entrants,
      matchCount: row.matchCount,
    }));
    return json({ tournaments: payload });
  } catch (error) {
    console.error(error);
    return json({ tournaments: [], error: "Failed to load tournaments" }, 500);
  }
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await readJson<TournamentBody>(request);
    const name = str(body.name);
    if (!name) return badRequest("Tournament name is required.");

    const startsAtRaw = str(body.startsAt);
    const startsAt = startsAtRaw ? new Date(startsAtRaw) : new Date();
    if (Number.isNaN(startsAt.getTime())) {
      return badRequest("Invalid start date.");
    }

    const matchType = str(body.matchType, "4-point");
    const status = str(body.status, "registration");
    const format = str(body.format, "3on3");

    let slug = slugify(name);
    const clash = await db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(eq(tournaments.slug, slug))
      .limit(1);
    if (clash.length) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const [created] = await db
      .insert(tournaments)
      .values({
        name,
        slug,
        description: optionalStr(body.description),
        location: optionalStr(body.location),
        format,
        matchType: MATCH_TYPES.some((m) => m.value === matchType)
          ? matchType
          : "4-point",
        maxPlayers: Math.max(2, Number(body.maxPlayers) || 8),
        status: TOURNAMENT_STATUSES.some((s) => s.value === status)
          ? status
          : "registration",
        prizePool: optionalStr(body.prizePool),
        startsAt,
        createdBy: user.id,
      })
      .returning();
    return json({ tournament: { ...created, entrants: 0, matchCount: 0 } }, 201);
  });
}
