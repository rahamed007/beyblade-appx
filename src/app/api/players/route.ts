import { asc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import {
  badRequest,
  json,
  optionalStr,
  readJson,
  str,
  withUser,
} from "@/lib/api";

export const dynamic = "force-dynamic";

type PlayerBody = {
  bladerName?: string;
  realName?: string;
  region?: string;
  team?: string;
  launchStyle?: string;
  signatureMove?: string;
  bio?: string;
};

export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const q = new URL(request.url).searchParams.get("q")?.trim();
    const rows = await db
      .select()
      .from(players)
      .where(
        q
          ? or(
              ilike(players.bladerName, `%${q}%`),
              ilike(players.realName, `%${q}%`),
              ilike(players.team, `%${q}%`),
            )
          : undefined,
      )
      .orderBy(asc(players.points), asc(players.bladerName));
    return json({ players: rows.reverse() });
  } catch (error) {
    console.error(error);
    return json({ players: [], error: "Failed to load players" }, 500);
  }
}

export async function POST(request: Request) {
  return withUser(async () => {
    const body = await readJson<PlayerBody>(request);
    const bladerName = str(body.bladerName);
    if (!bladerName) return badRequest("A blader name is required.");
    const [created] = await db
      .insert(players)
      .values({
        bladerName,
        realName: optionalStr(body.realName),
        region: optionalStr(body.region),
        team: optionalStr(body.team),
        launchStyle: str(body.launchStyle, "right"),
        signatureMove: optionalStr(body.signatureMove),
        bio: optionalStr(body.bio),
      })
      .returning();
    return json({ player: created }, 201);
  });
}
