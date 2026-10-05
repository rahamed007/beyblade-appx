import { json, num } from "@/lib/api";
import { computeStandings } from "@/lib/scoring";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const tournamentId = num(
      new URL(request.url).searchParams.get("tournamentId"),
    );
    if (!tournamentId) return json({ standings: [] });
    const standings = await computeStandings(tournamentId);
    return json({ standings });
  } catch (error) {
    console.error(error);
    return json({ standings: [], error: "Failed to load standings" }, 500);
  }
}
