import { asc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { beyblades } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import {
  badRequest,
  json,
  optionalStr,
  readJson,
  str,
  withUser,
} from "@/lib/api";
import { BEY_TYPES, SPIN_DIRECTIONS } from "@/lib/rules";

export const dynamic = "force-dynamic";

type BeyBody = {
  name?: string;
  blade?: string;
  ratchet?: string;
  bit?: string;
  type?: string;
  spin?: string;
  notes?: string;
};

export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const q = new URL(request.url).searchParams.get("q")?.trim();
    const rows = await db
      .select()
      .from(beyblades)
      .where(
        q
          ? or(
              ilike(beyblades.name, `%${q}%`),
              ilike(beyblades.blade, `%${q}%`),
              ilike(beyblades.bit, `%${q}%`),
            )
          : undefined,
      )
      .orderBy(asc(beyblades.name));
    return json({ beyblades: rows });
  } catch (error) {
    console.error(error);
    return json({ beyblades: [], error: "Failed to load catalog" }, 500);
  }
}

export async function POST(request: Request) {
  return withUser(async () => {
    const body = await readJson<BeyBody>(request);
    const name = str(body.name);
    const blade = str(body.blade);
    const ratchet = str(body.ratchet);
    const bit = str(body.bit);
    if (!name || !blade || !ratchet || !bit) {
      return badRequest("Name, blade, ratchet and bit are required.");
    }
    const type = str(body.type, "balance");
    const spin = str(body.spin, "right");
    const [created] = await db
      .insert(beyblades)
      .values({
        name,
        blade,
        ratchet,
        bit,
        type: BEY_TYPES.includes(type as (typeof BEY_TYPES)[number])
          ? type
          : "balance",
        spin: SPIN_DIRECTIONS.includes(spin as (typeof SPIN_DIRECTIONS)[number])
          ? spin
          : "right",
        notes: optionalStr(body.notes),
      })
      .returning();
    return json({ beyblade: created }, 201);
  });
}
