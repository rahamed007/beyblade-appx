import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  matches,
  players,
  registrations,
  tournaments,
} from "@/db/schema";
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
import { MATCH_TYPES, TOURNAMENT_STATUSES, validateDeck } from "@/lib/rules";
import type { DeckBey } from "@/db/schema";

export const dynamic = "force-dynamic";

type RegistrationPayload = {
  registration: {
    id: number;
    tournamentId: number;
    playerId: number;
    seed: number;
    status: string;
    deck: DeckBey[];
    notes: string | null;
    bladerName: string;
  };
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tournamentId = num(id);
  try {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);
    if (!tournament) return notFound("Tournament not found");

    const rows = await db
      .select({
        registration: registrations,
        bladerName: players.bladerName,
        region: players.region,
        team: players.team,
        wins: players.wins,
        losses: players.losses,
        points: players.points,
      })
      .from(registrations)
      .innerJoin(players, eq(registrations.playerId, players.id))
      .where(eq(registrations.tournamentId, tournamentId))
      .orderBy(asc(registrations.seed), asc(registrations.id));

    const entrants = rows.map((row) => ({
      ...row.registration,
      bladerName: row.bladerName,
      region: row.region,
      team: row.team,
      wins: row.wins,
      losses: row.losses,
      points: row.points,
    }));

    const tournamentMatches = await db
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId))
      .orderBy(asc(matches.round), asc(matches.tableNumber));

    return json({ tournament, entrants, matches: tournamentMatches });
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to load tournament" }, 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tournamentId = num(id);
  return withUser(async () => {
    const body = await readJson<Record<string, unknown>>(request);
    const updates: Partial<typeof tournaments.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (str(body.name)) updates.name = str(body.name);
    if ("description" in body) updates.description = optionalStr(body.description);
    if ("location" in body) updates.location = optionalStr(body.location);
    if ("prizePool" in body) updates.prizePool = optionalStr(body.prizePool);
    if (str(body.format)) updates.format = str(body.format);
    if (str(body.matchType)) {
      const matchType = str(body.matchType);
      updates.matchType = MATCH_TYPES.some((m) => m.value === matchType)
        ? matchType
        : "4-point";
    }
    if (str(body.status)) {
      const status = str(body.status);
      updates.status = TOURNAMENT_STATUSES.some((s) => s.value === status)
        ? status
        : "registration";
    }
    if (body.maxPlayers !== undefined) {
      updates.maxPlayers = Math.max(2, num(body.maxPlayers, 8));
    }
    if (str(body.startsAt)) {
      const startsAt = new Date(str(body.startsAt));
      if (Number.isNaN(startsAt.getTime())) return badRequest("Invalid date.");
      updates.startsAt = startsAt;
    }

    const [updated] = await db
      .update(tournaments)
      .set(updates)
      .where(eq(tournaments.id, tournamentId))
      .returning();
    if (!updated) return notFound("Tournament not found");
    return json({ tournament: updated });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tournamentId = num(id);
  return withUser(async () => {
    const [deleted] = await db
      .delete(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .returning({ id: tournaments.id });
    if (!deleted) return notFound("Tournament not found");
    return json({ ok: true, id: deleted.id });
  });
}

/** Register / update an entrant on this tournament. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tournamentId = num(id);
  return withUser(async () => {
    const body = await readJson<{
      playerId?: number;
      seed?: number;
      status?: string;
      deck?: DeckBey[];
      notes?: string;
    }>(request);
    const playerId = num(body.playerId);
    if (!playerId) return badRequest("Choose a blader to register.");

    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);
    if (!tournament) return notFound("Tournament not found");

    const deck = Array.isArray(body.deck) ? body.deck : [];
    const deckErrors = validateDeck(deck);
    if (deckErrors.length) return badRequest(deckErrors.join(" "));

    const existing = await db
      .select()
      .from(registrations)
      .where(
        and(
          eq(registrations.tournamentId, tournamentId),
          eq(registrations.playerId, playerId),
        ),
      )
      .limit(1);

    if (existing.length) {
      const [updated] = await db
        .update(registrations)
        .set({
          deck,
          seed: body.seed ? num(body.seed) : existing[0].seed,
          status: str(body.status, existing[0].status),
          notes: optionalStr(body.notes) ?? existing[0].notes,
        })
        .where(eq(registrations.id, existing[0].id))
        .returning();
      const payload: RegistrationPayload = {
        registration: { ...updated, bladerName: "" },
      };
      return json(payload);
    }

    const countRows = await db
      .select({ id: registrations.id })
      .from(registrations)
      .where(eq(registrations.tournamentId, tournamentId));
    if (countRows.length >= tournament.maxPlayers) {
      return badRequest(
        `This event is full (${tournament.maxPlayers} entrants max).`,
      );
    }

    const [created] = await db
      .insert(registrations)
      .values({
        tournamentId,
        playerId,
        seed: num(body.seed, countRows.length + 1),
        status: str(body.status, "confirmed"),
        deck,
        notes: optionalStr(body.notes),
      })
      .returning();
    const payload: RegistrationPayload = {
      registration: { ...created, bladerName: "" },
    };
    return json(payload, 201);
  });
}
