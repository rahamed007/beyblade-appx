import { db } from "@/db";
import {
  beyblades,
  matches,
  players,
  registrations,
  tournaments,
  users,
  type DeckBey,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";

let seedPromise: Promise<void> | null = null;

const CATALOG = [
  { name: "Dran Sword 3-60LF", blade: "DranSword", ratchet: "3-60", bit: "LF", type: "attack", spin: "right", notes: "Classic flat-rip attacker. Great first pick." },
  { name: "Hells Scythe 4-60T", blade: "HellsScythe", ratchet: "4-60", bit: "T", type: "balance", spin: "right", notes: "Upper-force scythe blade, hits hard from any angle." },
  { name: "Wizard Arrow 4-60N", blade: "WizardArrow", ratchet: "4-60", bit: "N", type: "defense", spin: "right", notes: "Needle bit keeps it glued to the centre." },
  { name: "Knight Shield 4-80N", blade: "KnightShield", ratchet: "4-80", bit: "N", type: "defense", spin: "right", notes: "Heavy shield blade for wall-style defense." },
  { name: "Phoenix Wing 9-60GF", blade: "PhoenixWing", ratchet: "9-60", bit: "GF", type: "defense", spin: "right", notes: "Gear Flat burst-resist monster." },
  { name: "Wizard Rod 1-60L", blade: "WizardRod", ratchet: "1-60", bit: "L", type: "stamina", spin: "right", notes: "Meta stamina rod with a low-profile ratchet." },
  { name: "Wizard Rod 3-70H", blade: "WizardRod", ratchet: "3-70", bit: "H", type: "stamina", spin: "right", notes: "High-ratchet rod build for long endurance battles." },
  { name: "Cobalt Dragoon 3-60LF", blade: "CobaltDragoon", ratchet: "3-60", bit: "LF", type: "attack", spin: "right", notes: "Left-right compatible upper attacker." },
  { name: "Dran Buster 5-60LR", blade: "DranBuster", ratchet: "5-60", bit: "LR", type: "attack", spin: "right", notes: "Buster blade with raw smash power." },
  { name: "Storm Pegasis 3-70RA", blade: "StormPegasis", ratchet: "3-70", bit: "RA", type: "attack", spin: "right", notes: "Rapid assault build, fastest launch in the room." },
  { name: "Rock Leone 6-80GN", blade: "RockLeone", ratchet: "6-80", bit: "GN", type: "defense", spin: "right", notes: "Gigantic needle defense tower." },
  { name: "Lightning L-Drago (Upper) 1-60F", blade: "LightningLDrago", ratchet: "1-60", bit: "F", type: "attack", spin: "left", notes: "Left-spin upper force — needs a left launcher." },
  { name: "Shark Edge 5-60LR", blade: "SharkEdge", ratchet: "5-60", bit: "LR", type: "attack", spin: "right", notes: "Aggressive edge-to-edge smash attacker." },
  { name: "Dran Brave J3-60LR", blade: "DranBrave", ratchet: "J3-60", bit: "LR", type: "balance", spin: "right", notes: "Brave blade, great burst resistance." },
  { name: "Scorpio Spear 9-60FB", blade: "ScorpioSpear", ratchet: "9-60", bit: "FB", type: "stamina", spin: "right", notes: "Free-ball bit for stingy survival wins." },
  { name: "Tyranno Beat 9-70P", blade: "TyrannoBeat", ratchet: "9-70", bit: "P", type: "balance", spin: "right", notes: "Jurassic World variant, heavy recoil control." },
  { name: "Tornado Rex 6-60W", blade: "TornadoRex", ratchet: "6-60", bit: "W", type: "defense", spin: "right", notes: "Wide tornado ridge deflects attackers." },
  { name: "Sphinx Cowl 5-60O", blade: "SphinxCowl", ratchet: "5-60", bit: "O", type: "stamina", spin: "right", notes: "Orb bit stability specialist." },
  { name: "Aero Pegasus 3-70L", blade: "AeroPegasus", ratchet: "3-70", bit: "L", type: "attack", spin: "right", notes: "Aero lift blade with wild movement." },
  { name: "Tricera Spiky 9-60U", blade: "TriceraSpiky", ratchet: "9-60", bit: "U", type: "balance", spin: "right", notes: "Spiked upper blade, punishes sloppy launches." },
  { name: "Dran Dagger 4-60R", blade: "DranDagger", ratchet: "4-60", bit: "R", type: "attack", spin: "right", notes: "Dash attacker built for Xtreme Zone KOs." },
  { name: "Viper Tail 7-60M", blade: "ViperTail", ratchet: "7-60", bit: "M", type: "balance", spin: "right", notes: "Tail-smash combo with tricky movement." },
  { name: "Croc Crunch 3-60LF", blade: "CrocCrunch", ratchet: "3-60", bit: "LF", type: "defense", spin: "right", notes: "Crunchy recoil absorption, sneaky good." },
  { name: "Cobalt Drake 5-60LR", blade: "CobaltDrake", ratchet: "5-60", bit: "LR", type: "attack", spin: "right", notes: "Drake blade, monster burst finisher." },
] as const;

type CatalogEntry = (typeof CATALOG)[number];

function deck(...names: CatalogEntry["name"][]): DeckBey[] {
  return names.map((name) => {
    const entry = CATALOG.find((c) => c.name === name);
    if (!entry) throw new Error(`Unknown catalog part: ${name}`);
    return { name: entry.name, blade: entry.blade, ratchet: entry.ratchet, bit: entry.bit };
  });
}

const DECKS: Record<string, DeckBey[]> = {
  DranSlayer: deck("Dran Sword 3-60LF", "Wizard Rod 1-60L", "Phoenix Wing 9-60GF"),
  ValtryekX: deck("Hells Scythe 4-60T", "Rock Leone 6-80GN", "Storm Pegasis 3-70RA"),
  StormKid: deck("Shark Edge 5-60LR", "Knight Shield 4-80N", "Cobalt Dragoon 3-60LF"),
  NeoPhoenix: deck("Dran Brave J3-60LR", "Tyranno Beat 9-70P", "Tornado Rex 6-60W"),
  BurstKing: deck("Dran Buster 5-60LR", "Wizard Arrow 4-60N", "Scorpio Spear 9-60FB"),
  GravityAce: deck("Lightning L-Drago (Upper) 1-60F", "Sphinx Cowl 5-60O", "Aero Pegasus 3-70L"),
  SpiralFang: deck("Tricera Spiky 9-60U", "Dran Dagger 4-60R", "Viper Tail 7-60M"),
  XtremeNova: deck("Croc Crunch 3-60LF", "Cobalt Drake 5-60LR", "Wizard Rod 3-70H"),
};

const PLAYER_SEED = [
  { bladerName: "DranSlayer", realName: "Kenta Ishida", region: "Tokyo", team: "Gear Edge", launchStyle: "right", signatureMove: "Spiral Xtreme Shoot", bio: "Two-time Xtreme Cup finalist who launches on a 45° angle for max spin axis.", wins: 24, losses: 9, battleWins: 78, battleLosses: 41, points: 96 },
  { bladerName: "ValtryekX", realName: "Hana Sato", region: "Osaka", team: "Gear Edge", launchStyle: "right", signatureMove: "Wing Guard Wall", bio: "Defense specialist, rarely loses the centre.", wins: 21, losses: 11, battleWins: 70, battleLosses: 48, points: 88 },
  { bladerName: "StormKid", realName: "Riku Tanaka", region: "Nagoya", team: "Nova Fang", launchStyle: "left", signatureMove: "Lightning Dash", bio: "Rookie of the year, left-spin conversion expert.", wins: 18, losses: 12, battleWins: 62, battleLosses: 50, points: 76 },
  { bladerName: "NeoPhoenix", realName: "Mei Kurosawa", region: "Fukuoka", team: "Nova Fang", launchStyle: "right", signatureMove: "Rebirth Combo", bio: "Deck-building nerd — reads the meta better than anyone.", wins: 20, losses: 13, battleWins: 66, battleLosses: 52, points: 79 },
  { bladerName: "BurstKing", realName: "Daichi Mori", region: "Sapporo", team: "Iron Circuit", launchStyle: "right", signatureMove: "Buster Breaker", bio: "Leads the circuit in burst finishes.", wins: 19, losses: 14, battleWins: 61, battleLosses: 55, points: 73 },
  { bladerName: "GravityAce", realName: "Yuki Ono", region: "Yokohama", team: "Iron Circuit", launchStyle: "left", signatureMove: "Zero-G Upper", bio: "Left-spin Upper Force tinkerer with a modded winder.", wins: 17, losses: 15, battleWins: 58, battleLosses: 57, points: 69 },
  { bladerName: "SpiralFang", realName: "Leo Fernandes", region: "São Paulo", team: "Team Rex", launchStyle: "right", signatureMove: "Fang Cyclone", bio: "International wildcard with an unpredictable movement pattern.", wins: 15, losses: 12, battleWins: 52, battleLosses: 49, points: 64 },
  { bladerName: "XtremeNova", realName: "Sofia Rossi", region: "Milan", team: "Team Rex", launchStyle: "right", signatureMove: "Nova Pocket Drop", bio: "Xtreme Zone sniper — 30% of her wins are pocket finishes.", wins: 16, losses: 13, battleWins: 55, battleLosses: 51, points: 66 },
] as const;

function daysFromNow(days: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function seed(): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return;

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        email: "admin@bx.gg",
        name: "Kai Sumeragi",
        passwordHash: hashPassword("letitrip"),
        role: "organizer",
      },
      {
        email: "judge@bx.gg",
        name: "Ren Kurogane",
        passwordHash: hashPassword("letitrip"),
        role: "judge",
      },
    ])
    .returning({ id: users.id });
  const adminId = insertedUsers[0]?.id ?? null;

  await db.insert(beyblades).values(
    CATALOG.map((entry) => ({
      name: entry.name,
      blade: entry.blade,
      ratchet: entry.ratchet,
      bit: entry.bit,
      type: entry.type,
      spin: entry.spin,
      notes: entry.notes,
    })),
  );

  const insertedPlayers = await db
    .insert(players)
    .values(
      PLAYER_SEED.map((p) => ({
        bladerName: p.bladerName,
        realName: p.realName,
        region: p.region,
        team: p.team,
        launchStyle: p.launchStyle,
        signatureMove: p.signatureMove,
        bio: p.bio,
        wins: p.wins,
        losses: p.losses,
        battleWins: p.battleWins,
        battleLosses: p.battleLosses,
        points: p.points,
      })),
    )
    .returning({ id: players.id, bladerName: players.bladerName });
  const playerIdByName = new Map(
    insertedPlayers.map((p) => [p.bladerName, p.id]),
  );

  const insertedTournaments = await db
    .insert(tournaments)
    .values([
      {
        name: "Xtreme Cup — Winter Circuit",
        slug: "xtreme-cup-winter-circuit",
        description:
          "The flagship 3on3 event of the winter season. 4-point matches, Xtreme Zone KOs score 3 points. Deck checks happen 15 minutes before round one.",
        location: "Tokyo Metropolitan Gym — Court B",
        format: "3on3",
        matchType: "4-point",
        maxPlayers: 8,
        status: "live",
        prizePool: "Beyblade X Ultimate DX Set + Trophy",
        startsAt: daysFromNow(-2, 12),
        createdBy: adminId,
      },
      {
        name: "Nagoya Burst Open",
        slug: "nagoya-burst-open",
        description:
          "Best of 3 sets, 4-point matches. Loser of each set picks launch position for the next set.",
        location: "Nagoya Civic Hall",
        format: "3on3",
        matchType: "bestof3",
        maxPlayers: 8,
        status: "completed",
        prizePool: "Stadium + Launcher kit",
        startsAt: daysFromNow(-24, 11),
        createdBy: adminId,
      },
      {
        name: "Osaka Blades Invitational",
        slug: "osaka-blades-invitational",
        description:
          "Invite-only 5-point marathon. Bring a sealed deck case — judge inspection is strict.",
        location: "Osaka Blade Arena",
        format: "3on3",
        matchType: "5-point",
        maxPlayers: 8,
        status: "registration",
        prizePool: "Champion's belt + 40,000¥",
        startsAt: daysFromNow(9, 13),
        createdBy: adminId,
      },
      {
        name: "Neon Galaxy Regional — Qualifier",
        slug: "neon-galaxy-regional-qualifier",
        description:
          "Still being planned. Format will be locked once the venue is confirmed.",
        location: "Yokohama Community Center",
        format: "3on3",
        matchType: "7-point",
        maxPlayers: 16,
        status: "draft",
        prizePool: "TBD",
        startsAt: daysFromNow(30, 12),
        createdBy: adminId,
      },
    ])
    .returning({ id: tournaments.id, slug: tournaments.slug });
  const tId = (slug: string) =>
    insertedTournaments.find((t) => t.slug === slug)?.id ?? 0;

  const live = tId("xtreme-cup-winter-circuit");
  const nagoya = tId("nagoya-burst-open");
  const osaka = tId("osaka-blades-invitational");

  const roster = PLAYER_SEED.map((p) => p.bladerName);

  await db.insert(registrations).values([
    ...roster.map((blader, index) => ({
      tournamentId: live,
      playerId: playerIdByName.get(blader)!,
      seed: index + 1,
      status: "confirmed",
      deck: DECKS[blader] ?? [],
      notes: null,
    })),
    ...roster.slice(0, 8).map((blader, index) => ({
      tournamentId: nagoya,
      playerId: playerIdByName.get(blader)!,
      seed: index + 1,
      status: "confirmed",
      deck: DECKS[blader] ?? [],
      notes: null,
    })),
    ...roster.slice(0, 5).map((blader, index) => ({
      tournamentId: osaka,
      playerId: playerIdByName.get(blader)!,
      seed: index + 1,
      status: index < 3 ? "confirmed" : "pending",
      deck: DECKS[blader] ?? [],
      notes: index === 3 ? "Waiting on deck confirmation from judge." : null,
    })),
  ]);

  const pid = (blader: string) => playerIdByName.get(blader)!;

  await db.insert(matches).values([
    // --- Xtreme Cup: round 1 (completed) ---
    { tournamentId: live, round: 1, tableNumber: 1, playerAId: pid("DranSlayer"), playerBId: pid("BurstKing"), scoreA: 4, scoreB: 2, battlesA: 2, battlesB: 1, winnerId: pid("DranSlayer"), finishType: "xtreme", status: "completed", playedAt: daysFromNow(-2, 13), notes: "Round 1 — table 1. Gear Flat held the centre." },
    { tournamentId: live, round: 1, tableNumber: 2, playerAId: pid("ValtryekX"), playerBId: pid("GravityAce"), scoreA: 4, scoreB: 1, battlesA: 3, battlesB: 1, winnerId: pid("ValtryekX"), finishType: "burst", status: "completed", playedAt: daysFromNow(-2, 13), notes: "Round 1 — table 2." },
    { tournamentId: live, round: 1, tableNumber: 3, playerAId: pid("StormKid"), playerBId: pid("SpiralFang"), scoreA: 3, scoreB: 4, battlesA: 1, battlesB: 2, winnerId: pid("SpiralFang"), finishType: "pocket", status: "completed", playedAt: daysFromNow(-2, 14), notes: "Upset of round 1 — pocket finish on match point." },
    { tournamentId: live, round: 1, tableNumber: 4, playerAId: pid("NeoPhoenix"), playerBId: pid("XtremeNova"), scoreA: 4, scoreB: 3, battlesA: 2, battlesB: 2, winnerId: pid("NeoPhoenix"), finishType: "survivor", status: "completed", playedAt: daysFromNow(-2, 14), notes: "Went down to the final battle." },
    // --- Xtreme Cup: semi finals ---
    { tournamentId: live, round: 2, tableNumber: 1, playerAId: pid("DranSlayer"), playerBId: pid("SpiralFang"), scoreA: 4, scoreB: 0, battlesA: 3, battlesB: 0, winnerId: pid("DranSlayer"), finishType: "xtreme", status: "completed", playedAt: daysFromNow(-1, 15), notes: "Semi final. Clean sweep." },
    { tournamentId: live, round: 2, tableNumber: 2, playerAId: pid("ValtryekX"), playerBId: pid("NeoPhoenix"), scoreA: 2, scoreB: 4, battlesA: 1, battlesB: 3, winnerId: pid("NeoPhoenix"), finishType: "burst", status: "completed", playedAt: daysFromNow(-1, 15), notes: "Semi final. NeoPhoenix deck swap paid off." },
    { tournamentId: live, round: 3, tableNumber: 1, playerAId: pid("DranSlayer"), playerBId: pid("NeoPhoenix"), scoreA: 0, scoreB: 0, battlesA: 0, battlesB: 0, winnerId: null, finishType: null, status: "scheduled", playedAt: null, notes: "Grand final — deck check 15 minutes prior." },
    { tournamentId: live, round: 3, tableNumber: 2, playerAId: pid("ValtryekX"), playerBId: pid("SpiralFang"), scoreA: 2, scoreB: 2, battlesA: 0, battlesB: 0, winnerId: null, finishType: null, status: "live", playedAt: daysFromNow(0, 11), notes: "Third place playoff, battle 3 in progress." },

    // --- Nagoya Burst Open (completed bracket) ---
    { tournamentId: nagoya, round: 1, tableNumber: 1, playerAId: pid("DranSlayer"), playerBId: pid("XtremeNova"), scoreA: 4, scoreB: 3, battlesA: 3, battlesB: 3, winnerId: pid("DranSlayer"), finishType: "survivor", status: "completed", playedAt: daysFromNow(-24, 12), notes: "Best of 3, set 3 decided it." },
    { tournamentId: nagoya, round: 1, tableNumber: 2, playerAId: pid("ValtryekX"), playerBId: pid("BurstKing"), scoreA: 4, scoreB: 2, battlesA: 2, battlesB: 1, winnerId: pid("ValtryekX"), finishType: "burst", status: "completed", playedAt: daysFromNow(-24, 12), notes: null },
    { tournamentId: nagoya, round: 1, tableNumber: 3, playerAId: pid("StormKid"), playerBId: pid("GravityAce"), scoreA: 4, scoreB: 1, battlesA: 3, battlesB: 1, winnerId: pid("StormKid"), finishType: "xtreme", status: "completed", playedAt: daysFromNow(-24, 13), notes: null },
    { tournamentId: nagoya, round: 1, tableNumber: 4, playerAId: pid("NeoPhoenix"), playerBId: pid("SpiralFang"), scoreA: 3, scoreB: 4, battlesA: 2, battlesB: 3, winnerId: pid("SpiralFang"), finishType: "pocket", status: "completed", playedAt: daysFromNow(-24, 13), notes: null },
    { tournamentId: nagoya, round: 2, tableNumber: 1, playerAId: pid("DranSlayer"), playerBId: pid("StormKid"), scoreA: 4, scoreB: 1, battlesA: 3, battlesB: 1, winnerId: pid("DranSlayer"), finishType: "burst", status: "completed", playedAt: daysFromNow(-24, 15), notes: "Semi final." },
    { tournamentId: nagoya, round: 2, tableNumber: 2, playerAId: pid("ValtryekX"), playerBId: pid("SpiralFang"), scoreA: 4, scoreB: 2, battlesA: 2, battlesB: 1, winnerId: pid("ValtryekX"), finishType: "survivor", status: "completed", playedAt: daysFromNow(-24, 15), notes: "Semi final." },
    { tournamentId: nagoya, round: 3, tableNumber: 1, playerAId: pid("DranSlayer"), playerBId: pid("ValtryekX"), scoreA: 4, scoreB: 2, battlesA: 3, battlesB: 2, winnerId: pid("DranSlayer"), finishType: "xtreme", status: "completed", playedAt: daysFromNow(-24, 17), notes: "Final — Gear Edge takes the title." },
  ]);
}

/** Idempotent, memoised demo seeding so a fresh database feels alive. */
export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seed().catch((error) => {
      seedPromise = null;
      console.error("[seed] failed", error);
    });
  }
  return seedPromise;
}
