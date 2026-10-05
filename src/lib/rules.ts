import type { DeckBey } from "@/db/schema";

export const MATCH_TYPES = [
  {
    value: "4-point",
    label: "4-Point Match",
    pointsToWin: 4,
    official: true,
    blurb: "First blader to earn 4 points wins the set.",
  },
  {
    value: "5-point",
    label: "5-Point Match",
    pointsToWin: 5,
    official: false,
    blurb: "First blader to earn 5 points wins the set.",
  },
  {
    value: "7-point",
    label: "7-Point Match",
    pointsToWin: 7,
    official: false,
    blurb: "Long set — first blader to earn 7 points wins.",
  },
  {
    value: "bestof3",
    label: "Best of 3 (4-Point)",
    pointsToWin: 4,
    official: false,
    blurb: "Win two 4-point sets to take the match.",
  },
] as const;

export const TOURNAMENT_STATUSES = [
  { value: "draft", label: "Draft", tone: "slate" },
  { value: "registration", label: "Registration", tone: "cyan" },
  { value: "live", label: "Live", tone: "amber" },
  { value: "completed", label: "Completed", tone: "green" },
] as const;

export const MATCH_STATUSES = [
  { value: "scheduled", label: "Scheduled", tone: "slate" },
  { value: "live", label: "Live", tone: "amber" },
  { value: "completed", label: "Completed", tone: "green" },
] as const;

/** Official Beyblade X battle results and their point values. */
export const FINISH_TYPES = [
  { value: "survivor", label: "Survivor Finish", points: 1 },
  { value: "burst", label: "Burst Finish", points: 2 },
  { value: "xtreme", label: "Xtreme Finish (Over Zone)", points: 2 },
  { value: "pocket", label: "Xtreme Finish (Xtreme Zone)", points: 3 },
  { value: "draw", label: "Double KO / Draw", points: 1 },
] as const;

export const BEY_TYPES = ["attack", "defense", "stamina", "balance"] as const;
export const SPIN_DIRECTIONS = ["right", "left"] as const;

export type FinishType = (typeof FINISH_TYPES)[number]["value"];

export function pointsForFinish(finish: string): number {
  return FINISH_TYPES.find((f) => f.value === finish)?.points ?? 1;
}

export function matchTypePointsToWin(matchType: string): number {
  return MATCH_TYPES.find((m) => m.value === matchType)?.pointsToWin ?? 4;
}

export function isMatchComplete(
  matchType: string,
  scoreA: number,
  scoreB: number,
): boolean {
  const needed = matchTypePointsToWin(matchType);
  return scoreA >= needed || scoreB >= needed;
}

/**
 * Beyblade X deck legality: each of the 12 parts across a 3-Bey deck must be
 * unique — no duplicated blades, ratchets or bits (colour variations of the same
 * part still count as the same part).
 */
export function validateDeck(deck: DeckBey[]): string[] {
  const errors: string[] = [];
  if (deck.length !== 3) {
    errors.push("A legal 3on3 deck must contain exactly 3 Beys.");
    return errors;
  }

  const seen = { blade: new Map<string, number>(), ratchet: new Map<string, number>(), bit: new Map<string, number>() };
  const labels = {
    blade: "Blade",
    ratchet: "Ratchet",
    bit: "Bit",
  } as const;

  deck.forEach((bey, index) => {
    (["blade", "ratchet", "bit"] as const).forEach((part) => {
      const value = (bey[part] ?? "").trim().toLowerCase();
      if (!value) {
        errors.push(`Bey ${index + 1} is missing its ${labels[part]}.`);
        return;
      }
      const owner = seen[part].get(value);
      if (owner !== undefined) {
        errors.push(
          `Illegal deck: two copies of the ${labels[part]} "${bey[part]}" (Bey ${owner + 1} and Bey ${index + 1}).`,
        );
      } else {
        seen[part].set(value, index);
      }
    });
  });

  return errors;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
