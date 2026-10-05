"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { BeyGlyph, EmptyState, Icon, Spinner } from "@/components/icons";
import { apiRequest, LoadingGrid } from "@/lib/client";
import type { Tournament } from "@/db/schema";

type StatsPayload = {
  stats: {
    tournaments: number;
    liveTournaments: number;
    players: number;
    matchesPlayed: number;
    upcoming: number;
    entrants: number;
  };
  activeTournaments: (Tournament & { entrants: number })[];
  recentMatches: {
    id: number;
    tournamentName: string;
    round: number;
    status: string;
    scoreA: number;
    scoreB: number;
    finishType: string | null;
    winnerId: number | null;
    playerAId: number;
    playerBId: number;
    playerAName: string;
    playerBName: string;
  }[];
  leaders: {
    id: number;
    bladerName: string;
    team: string | null;
    region: string | null;
    wins: number;
    losses: number;
    points: number;
    battleWins: number;
    battleLosses: number;
  }[];
  calendar: Tournament[];
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  registration: "bg-volt-400/15 text-volt-400",
  live: "bg-amber-400/15 text-amber-300",
  completed: "bg-emerald-400/15 text-emerald-300",
  scheduled: "bg-white/10 text-white/60",
};

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "blaze",
}: {
  icon: string;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "blaze" | "volt" | "emerald" | "amber";
}) {
  const tones = {
    blaze: "text-blaze-400 from-blaze-500/20",
    volt: "text-volt-400 from-volt-500/20",
    emerald: "text-emerald-300 from-emerald-500/20",
    amber: "text-amber-300 from-amber-500/20",
  } as const;
  return (
    <div className="card card-hover relative overflow-hidden p-5">
      <div
        className={`absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tones[tone].split(" ")[1]} to-transparent blur-2xl`}
      />
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 ${tones[tone].split(" ")[0]}`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
          {label}
        </p>
      </div>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<StatsPayload>("/api/stats")
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Control room"
        title="Tournament overview"
        description="Everything happening across your circuits right now."
        action={
          <Link href="/dashboard/matches" className="btn-ghost btn-sm">
            <Icon name="swords" className="h-3.5 w-3.5" /> Score a match
          </Link>
        }
      />

      {loading ? (
        <>
          <LoadingGrid rows={1} cols={4} />
          <div className="mt-6">
            <LoadingGrid rows={2} cols={2} />
          </div>
        </>
      ) : error || !data ? (
        <div className="card">
          <EmptyState
            icon="flame"
            title="Could not load the arena"
            description={error ?? "Please refresh the page."}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon="trophy"
              label="Tournaments"
              value={data.stats.tournaments}
              hint={`${data.stats.liveTournaments} running live`}
            />
            <StatCard
              icon="users"
              label="Bladers"
              value={data.stats.players}
              hint={`${data.stats.entrants} event entries`}
              tone="volt"
            />
            <StatCard
              icon="swords"
              label="Matches judged"
              value={data.stats.matchesPlayed}
              hint={`${data.stats.upcoming} still on deck`}
              tone="emerald"
            />
            <StatCard
              icon="flame"
              label="Live now"
              value={data.stats.liveTournaments}
              hint="Events currently in progress"
              tone="amber"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">
                  Active events
                </h2>
                <Link
                  href="/dashboard/tournaments"
                  className="text-xs font-semibold text-volt-400 hover:underline"
                >
                  View all
                </Link>
              </div>
              {data.activeTournaments.length === 0 ? (
                <EmptyState
                  icon="trophy"
                  title="No events running"
                  description="Create a tournament to start registering bladers."
                  action={
                    <Link href="/dashboard/tournaments" className="btn-primary btn-sm">
                      <Icon name="plus" className="h-3.5 w-3.5" /> New tournament
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {data.activeTournaments.map((tournament) => (
                    <Link
                      key={tournament.id}
                      href={`/dashboard/tournaments/${tournament.id}`}
                      className="card card-hover flex items-center gap-4 p-4"
                    >
                      <BeyGlyph className="h-9 w-9 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">
                          {tournament.name}
                        </p>
                        <p className="truncate text-xs text-white/45">
                          {tournament.location ?? "Venue TBA"} ·{" "}
                          {tournament.format} · {tournament.matchType}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`badge ${STATUS_STYLES[tournament.status] ?? "bg-white/10 text-white/60"}`}
                        >
                          {tournament.status}
                        </span>
                        <p className="mt-1 text-[11px] text-white/40">
                          {tournament.entrants}/{tournament.maxPlayers} bladers
                        </p>
                      </div>
                      <Icon name="chevron" className="h-4 w-4 -rotate-90 text-white/30" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">
                  Top bladers
                </h2>
                <Icon name="chart" className="h-4 w-4 text-white/30" />
              </div>
              {data.leaders.length === 0 ? (
                <EmptyState
                  icon="users"
                  title="No bladers yet"
                  description="Add blader profiles to build the leaderboard."
                />
              ) : (
                <ol className="space-y-2.5">
                  {data.leaders.map((player, index) => {
                    const total = player.wins + player.losses;
                    const winRate =
                      total === 0 ? 0 : Math.round((player.wins / total) * 100);
                    return (
                      <li key={player.id} className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                            index === 0
                              ? "bg-blaze-500/25 text-blaze-400"
                              : "bg-white/[0.06] text-white/50"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {player.bladerName}
                          </p>
                          <p className="truncate text-[11px] text-white/40">
                            {player.team ?? "Free agent"} · {player.region ?? "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">
                            {player.wins}–{player.losses}
                          </p>
                          <p className="text-[11px] text-white/40">{winRate}% WR</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">
                Latest results
              </h2>
              <Link
                href="/dashboard/matches"
                className="text-xs font-semibold text-volt-400 hover:underline"
              >
                Match desk
              </Link>
            </div>
            {data.recentMatches.length === 0 ? (
              <EmptyState
                icon="swords"
                title="No matches recorded"
                description="Schedule a match and log the finish type to see results here."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.recentMatches.map((match) => {
                  const complete = match.status === "completed";
                  return (
                    <div
                      key={match.id}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                    >
                      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-white/35">
                        <span>
                          {match.tournamentName} · R{match.round}
                        </span>
                        <span
                          className={`badge ${STATUS_STYLES[match.status] ?? "bg-white/10"}`}
                        >
                          {match.status === "live" ? (
                            <>
                              <Spinner className="h-2.5 w-2.5" /> live
                            </>
                          ) : (
                            match.status
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`truncate text-sm font-semibold ${
                            complete && match.winnerId === match.playerAId
                              ? "text-emerald-300"
                              : "text-white/80"
                          }`}
                        >
                          {match.playerAName}
                        </span>
                        <span className="rounded-lg bg-white/10 px-2.5 py-0.5 text-sm font-black">
                          {match.scoreA} – {match.scoreB}
                        </span>
                        <span
                          className={`truncate text-right text-sm font-semibold ${
                            complete && match.winnerId === match.playerBId
                              ? "text-emerald-300"
                              : "text-white/80"
                          }`}
                        >
                          {match.playerBName}
                        </span>
                      </div>
                      {complete && match.finishType ? (
                        <p className="mt-2 text-[11px] uppercase tracking-wider text-white/35">
                          {match.finishType.replace("survivor", "survivor finish")}
                          {match.finishType === "pocket"
                            ? " · 3 pts"
                            : match.finishType === "draw"
                              ? ""
                              : " · 2 pts"}
                        </p>
                      ) : (
                        <p className="mt-2 text-[11px] uppercase tracking-wider text-white/25">
                          awaiting judge
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
