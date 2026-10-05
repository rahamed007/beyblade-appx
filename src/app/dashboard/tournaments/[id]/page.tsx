"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { use, type ReactNode } from "react";
import { EmptyState, Icon, Spinner } from "@/components/icons";
import {
  ConfirmDelete,
  LoadingRows,
  Modal,
  SubmitButton,
  apiRequest,
} from "@/lib/client";
import { useToast } from "@/components/toast";
import {
  FINISH_TYPES,
  MATCH_TYPES,
  TOURNAMENT_STATUSES,
  validateDeck,
} from "@/lib/rules";
import type { Beyblade, DeckBey, Match, Player, Tournament } from "@/db/schema";

type Entrant = {
  id: number;
  tournamentId: number;
  playerId: number;
  seed: number;
  status: string;
  deck: DeckBey[];
  notes: string | null;
  bladerName: string;
  region: string | null;
  team: string | null;
  wins: number;
  losses: number;
};

type StandingRow = {
  playerId: number;
  bladerName: string;
  team: string | null;
  seed: number;
  status: string;
  deckSize: number;
  matchesPlayed: number;
  matchWins: number;
  matchLosses: number;
  battleWins: number;
  battleLosses: number;
  matchPoints: number;
  diff: number;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  registration: "bg-volt-400/15 text-volt-400",
  live: "bg-amber-400/15 text-amber-300",
  completed: "bg-emerald-400/15 text-emerald-300",
  scheduled: "bg-white/10 text-white/60",
  confirmed: "bg-emerald-400/15 text-emerald-300",
  pending: "bg-amber-400/15 text-amber-300",
  dropped: "bg-rose-500/15 text-rose-300",
};

const EMPTY_DECK: DeckBey[] = [
  { name: "", blade: "", ratchet: "", bit: "" },
  { name: "", blade: "", ratchet: "", bit: "" },
  { name: "", blade: "", ratchet: "", bit: "" },
];

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-white/70">
      {children}
    </span>
  );
}

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tournamentId = Number(id);
  const toast = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [catalog, setCatalog] = useState<Beyblade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"entrants" | "matches" | "standings">("entrants");
  const [busy, setBusy] = useState(false);

  const [deckModal, setDeckModal] = useState<{ entrant?: Entrant; mode: "new" | "edit" } | null>(
    null,
  );
  const [deckPlayerId, setDeckPlayerId] = useState("");
  const [deck, setDeck] = useState<DeckBey[]>(EMPTY_DECK);
  const [deckStatus, setDeckStatus] = useState("confirmed");
  const [savingDeck, setSavingDeck] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Entrant | null>(null);
  const [matchModal, setMatchModal] = useState<Match | null>(null);
  const [matchForm, setMatchForm] = useState({
    status: "completed",
    scoreA: 0,
    scoreB: 0,
    battlesA: 0,
    battlesB: 0,
    winnerId: "",
    finishType: "xtreme",
    notes: "",
  });
  const [savingMatch, setSavingMatch] = useState(false);

  const load = useCallback(async () => {
    try {
      const [detail, playerList, catalogList, standingsList] = await Promise.all([
        apiRequest<{ tournament: Tournament; entrants: Entrant[]; matches: Match[] }>(
          `/api/tournaments/${tournamentId}`,
        ),
        apiRequest<{ players: Player[] }>("/api/players"),
        apiRequest<{ beyblades: Beyblade[] }>("/api/beyblades"),
        apiRequest<{ standings: StandingRow[] }>(
          `/api/standings?tournamentId=${tournamentId}`,
        ),
      ]);
      setTournament(detail.tournament);
      setEntrants(detail.entrants);
      setMatches(detail.matches);
      setPlayers(playerList.players);
      setCatalog(catalogList.beyblades);
      setStandings(standingsList.standings);
    } catch (err) {
      toast.push((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const deckErrors = useMemo(() => validateDeck(deck), [deck]);
  const availablePlayers = useMemo(
    () =>
      players.filter(
        (player) =>
          !entrants.some((entrant) => entrant.playerId === player.id) ||
          deckModal?.entrant?.playerId === player.id,
      ),
    [players, entrants, deckModal],
  );

  function openNewEntrant() {
    setDeckPlayerId(String(availablePlayers[0]?.id ?? ""));
    setDeck(EMPTY_DECK.map((b) => ({ ...b })));
    setDeckStatus("confirmed");
    setDeckModal({ mode: "new" });
  }

  function openEditEntrant(entrant: Entrant) {
    setDeckPlayerId(String(entrant.playerId));
    setDeck(
      entrant.deck?.length === 3
        ? entrant.deck.map((b) => ({ ...b }))
        : EMPTY_DECK.map((b) => ({ ...b })),
    );
    setDeckStatus(entrant.status);
    setDeckModal({ mode: "edit", entrant });
  }

  function pickBey(slot: number, beyName: string) {
    const found = catalog.find((b) => b.name === beyName);
    setDeck((prev) =>
      prev.map((item, index) =>
        index === slot
          ? {
              name: found?.name ?? beyName,
              blade: found?.blade ?? "",
              ratchet: found?.ratchet ?? "",
              bit: found?.bit ?? "",
            }
          : item,
      ),
    );
  }

  async function saveDeck(event: React.FormEvent) {
    event.preventDefault();
    setSavingDeck(true);
    try {
      if (deckModal?.mode === "edit" && deckModal.entrant) {
        const previous = entrants;
        setEntrants((prev) =>
          prev.map((entrant) =>
            entrant.id === deckModal.entrant!.id
              ? { ...entrant, deck, status: deckStatus }
              : entrant,
          ),
        );
        try {
          await apiRequest(`/api/registrations/${deckModal.entrant.id}`, {
            method: "PATCH",
            body: { deck, status: deckStatus },
          });
          toast.push("Deck locked in.");
        } catch (err) {
          setEntrants(previous);
          toast.push((err as Error).message, "error");
        }
      } else {
        const created = await apiRequest<{ registration: Entrant }>(
          `/api/tournaments/${tournamentId}`,
          {
            method: "POST",
            body: { playerId: Number(deckPlayerId), deck, status: deckStatus },
          },
        );
        const player = players.find((p) => p.id === Number(deckPlayerId));
        setEntrants((prev) => [
          ...prev,
          { ...created.registration, bladerName: player?.bladerName ?? "Blader" },
        ]);
        toast.push("Blader registered.");
      }
      setDeckModal(null);
      await load();
    } catch (err) {
      toast.push((err as Error).message, "error");
    } finally {
      setSavingDeck(false);
    }
  }

  async function removeEntrant() {
    if (!deleteTarget) return;
    const previous = entrants;
    setEntrants((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    setDeleteTarget(null);
    try {
      await apiRequest(`/api/registrations/${deleteTarget.id}`, { method: "DELETE" });
      toast.push("Entry removed.");
    } catch (err) {
      setEntrants(previous);
      toast.push((err as Error).message, "error");
    }
    await load();
  }

  function openMatch(match: Match) {
    setMatchModal(match);
    setMatchForm({
      status: match.status,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      battlesA: match.battlesA,
      battlesB: match.battlesB,
      winnerId: match.winnerId ? String(match.winnerId) : "",
      finishType: match.finishType ?? "xtreme",
      notes: match.notes ?? "",
    });
  }

  async function saveMatch(event: React.FormEvent) {
    event.preventDefault();
    if (!matchModal) return;
    setSavingMatch(true);
    const previous = matches;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchModal.id
          ? {
              ...m,
              scoreA: matchForm.scoreA,
              scoreB: matchForm.scoreB,
              battlesA: matchForm.battlesA,
              battlesB: matchForm.battlesB,
              status: matchForm.status,
              finishType: matchForm.status === "completed" ? matchForm.finishType : null,
              winnerId:
                matchForm.winnerId === ""
                  ? null
                  : Number(matchForm.winnerId),
              notes: matchForm.notes || null,
            }
          : m,
      ),
    );
    try {
      await apiRequest(`/api/matches/${matchModal.id}`, {
        method: "PATCH",
        body: {
          ...matchForm,
          winnerId: matchForm.winnerId === "" ? null : Number(matchForm.winnerId),
          finishType: matchForm.status === "completed" ? matchForm.finishType : null,
        },
      });
      toast.push("Match updated.");
      setMatchModal(null);
      await load();
    } catch (err) {
      setMatches(previous);
      toast.push((err as Error).message, "error");
    } finally {
      setSavingMatch(false);
    }
  }

  async function changeStatus(status: string) {
    if (!tournament) return;
    const previous = tournament;
    setTournament({ ...tournament, status });
    try {
      await apiRequest(`/api/tournaments/${tournament.id}`, {
        method: "PATCH",
        body: { status },
      });
      toast.push(`Event is now ${status}.`);
    } catch (err) {
      setTournament(previous);
      toast.push((err as Error).message, "error");
    }
  }

  if (loading) {
    return (
      <div>
        <div className="skeleton mb-6 h-9 w-72" />
        <div className="card p-5">
          <LoadingRows rows={6} />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="card">
        <EmptyState
          icon="trophy"
          title="Tournament not found"
          description="It may have been deleted."
          action={
            <Link href="/dashboard/tournaments" className="btn-primary btn-sm">
              Back to tournaments
            </Link>
          }
        />
      </div>
    );
  }

  const tabs: { key: typeof tab; label: string; count?: number }[] = [
    { key: "entrants", label: "Entrants & decks", count: entrants.length },
    { key: "matches", label: "Matches", count: matches.length },
    { key: "standings", label: "Standings", count: standings.length },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/tournaments"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white/45 hover:text-white"
        >
          <Icon name="chevron" className="h-3.5 w-3.5 rotate-90" /> All tournaments
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`badge ${STATUS_STYLES[tournament.status] ?? "bg-white/10"}`}
              >
                {tournament.status}
              </span>
              <Chip>{tournament.format}</Chip>
              <Chip>
                {MATCH_TYPES.find((m) => m.value === tournament.matchType)?.label}
              </Chip>
            </div>
            <h1 className="text-2xl font-black tracking-tight lg:text-3xl">
              {tournament.name}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {tournament.location ?? "Venue TBA"} ·{" "}
              {new Date(tournament.startsAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            {tournament.description ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
                {tournament.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="input w-40"
              value={tournament.status}
              onChange={(e) => changeStatus(e.target.value)}
              aria-label="Tournament status"
            >
              {TOURNAMENT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn-primary" onClick={openNewEntrant}>
              <Icon name="plus" className="h-4 w-4" /> Register blader
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-black/30 p-1">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item.key
                ? "bg-white/10 text-white"
                : "text-white/45 hover:text-white"
            }`}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className="rounded-full bg-white/10 px-1.5 text-[10px]">
                {item.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "entrants" ? (
        <div className="card overflow-hidden">
          {entrants.length === 0 ? (
            <EmptyState
              icon="users"
              title="No bladers registered"
              description="Add bladers and lock in their 3-Bey decks — duplicate parts are blocked automatically."
              action={
                <button type="button" className="btn-primary btn-sm" onClick={openNewEntrant}>
                  <Icon name="plus" className="h-3.5 w-3.5" /> Register first blader
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="border-b border-white/10 bg-white/[0.02]">
                  <tr>
                    <th className="table-head">Seed</th>
                    <th className="table-head">Blader</th>
                    <th className="table-head">Deck (3 Beys)</th>
                    <th className="table-head">Status</th>
                    <th className="table-head text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entrants.map((entrant) => (
                    <tr key={entrant.id} className="transition hover:bg-white/[0.03]">
                      <td className="table-cell font-black text-white/50">
                        #{entrant.seed}
                      </td>
                      <td className="table-cell">
                        <p className="font-bold text-white">{entrant.bladerName}</p>
                        <p className="text-xs text-white/40">
                          {entrant.team ?? "Free agent"} · {entrant.region ?? "—"}
                        </p>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {entrant.deck?.length ? (
                            entrant.deck.map((bey, index) => (
                              <span
                                key={`${entrant.id}-${index}`}
                                className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/70"
                              >
                                <span className="font-bold text-blaze-400">
                                  {index + 1}.
                                </span>{" "}
                                {bey.name || "—"}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-amber-300/80">
                              Deck not submitted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`badge ${STATUS_STYLES[entrant.status] ?? "bg-white/10"}`}
                        >
                          {entrant.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => openEditEntrant(entrant)}
                            aria-label="Edit deck"
                          >
                            <Icon name="edit" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="icon-btn hover:!border-rose-500/40 hover:!text-rose-300"
                            onClick={() => setDeleteTarget(entrant)}
                            aria-label="Remove entry"
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === "matches" ? (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="swords"
                title="No matches scheduled"
                description="Create matches from the Match Desk once registration closes."
                action={
                  <Link href="/dashboard/matches" className="btn-primary btn-sm">
                    <Icon name="plus" className="h-3.5 w-3.5" /> Go to match desk
                  </Link>
                }
              />
            </div>
          ) : (
            matches.map((match) => {
              const playerA = players.find((p) => p.id === match.playerAId);
              const playerB = players.find((p) => p.id === match.playerBId);
              return (
                <div
                  key={match.id}
                  className="card card-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex w-24 shrink-0 items-center gap-2">
                    <Chip>R{match.round}</Chip>
                    <Chip>T{match.tableNumber}</Chip>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <span
                      className={`truncate text-sm font-bold ${
                        match.winnerId === match.playerAId
                          ? "text-emerald-300"
                          : "text-white/80"
                      }`}
                    >
                      {playerA?.bladerName ?? `#${match.playerAId}`}
                    </span>
                    <span className="rounded-lg bg-white/10 px-3 py-1 text-sm font-black">
                      {match.scoreA} – {match.scoreB}
                    </span>
                    <span
                      className={`truncate text-right text-sm font-bold ${
                        match.winnerId === match.playerBId
                          ? "text-emerald-300"
                          : "text-white/80"
                      }`}
                    >
                      {playerB?.bladerName ?? `#${match.playerBId}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <span
                      className={`badge ${STATUS_STYLES[match.status] ?? "bg-white/10"}`}
                    >
                      {match.status}
                    </span>
                    <button
                      type="button"
                      className="btn-volt btn-sm"
                      onClick={() => openMatch(match)}
                    >
                      <Icon name="target" className="h-3.5 w-3.5" /> Judge
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {tab === "standings" ? (
        <div className="card overflow-hidden">
          {standings.length === 0 ? (
            <EmptyState
              icon="chart"
              title="Standings will appear once bladers register"
              description="Wins, battle record and point differential are computed from judged matches."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-white/10 bg-white/[0.02]">
                  <tr>
                    <th className="table-head">#</th>
                    <th className="table-head">Blader</th>
                    <th className="table-head">Played</th>
                    <th className="table-head">W–L</th>
                    <th className="table-head">Battles</th>
                    <th className="table-head">Pts</th>
                    <th className="table-head">+/-</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {standings.map((row, index) => (
                    <tr
                      key={row.playerId}
                      className={`transition hover:bg-white/[0.03] ${index === 0 ? "bg-blaze-500/[0.07]" : ""}`}
                    >
                      <td className="table-cell">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                            index === 0
                              ? "bg-blaze-500/25 text-blaze-400"
                              : "bg-white/[0.06] text-white/50"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="table-cell">
                        <p className="font-bold text-white">{row.bladerName}</p>
                        <p className="text-xs text-white/40">
                          {row.team ?? "Free agent"} · seed #{row.seed}
                        </p>
                      </td>
                      <td className="table-cell">{row.matchesPlayed}</td>
                      <td className="table-cell font-bold text-white">
                        {row.matchWins}–{row.matchLosses}
                      </td>
                      <td className="table-cell text-white/60">
                        {row.battleWins}–{row.battleLosses}
                      </td>
                      <td className="table-cell font-bold">{row.matchPoints}</td>
                      <td
                        className={`table-cell font-bold ${row.diff > 0 ? "text-emerald-300" : row.diff < 0 ? "text-rose-300" : "text-white/50"}`}
                      >
                        {row.diff > 0 ? `+${row.diff}` : row.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* Deck / registration modal */}
      <Modal
        open={Boolean(deckModal)}
        onClose={() => setDeckModal(null)}
        title={deckModal?.mode === "edit" ? "Edit deck & entry" : "Register blader"}
        description="3on3 rule: every blade, ratchet and bit in a deck must be unique."
        wide
      >
        <form onSubmit={saveDeck} className="space-y-4">
          {deckModal?.mode === "new" ? (
            <div>
              <label className="label" htmlFor="deck-player">
                Blader
              </label>
              <select
                id="deck-player"
                className="input"
                value={deckPlayerId}
                onChange={(e) => setDeckPlayerId(e.target.value)}
                required
              >
                {availablePlayers.length === 0 ? (
                  <option value="">No bladers available</option>
                ) : null}
                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.bladerName}
                    {player.team ? ` — ${player.team}` : ""}
                  </option>
                ))}
              </select>
              {availablePlayers.length === 0 ? (
                <p className="mt-2 text-xs text-amber-300/80">
                  Every registered blader is already in this event — add more on the
                  Bladers page.
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="label">Deck order (1st, 2nd, 3rd Bey)</label>
            <div className="space-y-2">
              {deck.map((bey, slot) => (
                <div
                  key={slot}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-3 sm:flex-row sm:items-center"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blaze-500/20 text-sm font-black text-blaze-400">
                    {slot + 1}
                  </span>
                  <select
                    className="input flex-1"
                    value={bey.name}
                    onChange={(e) => pickBey(slot, e.target.value)}
                  >
                    <option value="">Select a Bey…</option>
                    {catalog.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name} · {item.type}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1.5">
                    <Chip>{bey.blade || "blade"}</Chip>
                    <Chip>{bey.ratchet || "ratchet"}</Chip>
                    <Chip>{bey.bit || "bit"}</Chip>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="deck-status">
              Entry status
            </label>
            <select
              id="deck-status"
              className="input sm:w-56"
              value={deckStatus}
              onChange={(e) => setDeckStatus(e.target.value)}
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending deck check</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          {deckErrors.length ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">
              {deckErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-200">
              <Icon name="check" className="h-4 w-4" /> Legal deck — all 9 parts unique
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" className="btn-ghost" onClick={() => setDeckModal(null)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={savingDeck || deckErrors.length > 0 || !deckPlayerId}
            >
              {savingDeck ? (
                <>
                  <Spinner /> Saving…
                </>
              ) : deckModal?.mode === "edit" ? (
                "Save deck"
              ) : (
                "Register blader"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Judge modal */}
      <Modal
        open={Boolean(matchModal)}
        onClose={() => setMatchModal(null)}
        title="Judge match"
        description="Battle results are scored automatically and standings refresh instantly."
      >
        <form onSubmit={saveMatch} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="score-a">
                {players.find((p) => p.id === matchModal?.playerAId)?.bladerName} points
              </label>
              <input
                id="score-a"
                type="number"
                min={0}
                max={21}
                className="input"
                value={matchForm.scoreA}
                onChange={(e) =>
                  setMatchForm({ ...matchForm, scoreA: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="score-b">
                {players.find((p) => p.id === matchModal?.playerBId)?.bladerName} points
              </label>
              <input
                id="score-b"
                type="number"
                min={0}
                max={21}
                className="input"
                value={matchForm.scoreB}
                onChange={(e) =>
                  setMatchForm({ ...matchForm, scoreB: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="battles-a">
                Battles won (A)
              </label>
              <input
                id="battles-a"
                type="number"
                min={0}
                max={21}
                className="input"
                value={matchForm.battlesA}
                onChange={(e) =>
                  setMatchForm({ ...matchForm, battlesA: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="battles-b">
                Battles won (B)
              </label>
              <input
                id="battles-b"
                type="number"
                min={0}
                max={21}
                className="input"
                value={matchForm.battlesB}
                onChange={(e) =>
                  setMatchForm({ ...matchForm, battlesB: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="finish">
                Final battle result
              </label>
              <select
                id="finish"
                className="input"
                value={matchForm.finishType}
                onChange={(e) =>
                  setMatchForm({ ...matchForm, finishType: e.target.value })
                }
              >
                {FINISH_TYPES.map((finish) => (
                  <option key={finish.value} value={finish.value}>
                    {finish.label} ({finish.points} pt
                    {finish.points === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="status">
                Match status
              </label>
              <select
                id="status"
                className="input"
                value={matchForm.status}
                onChange={(e) => setMatchForm({ ...matchForm, status: e.target.value })}
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="notes">
              Judge notes
            </label>
            <textarea
              id="notes"
              className="input min-h-20"
              value={matchForm.notes}
              onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
              placeholder="Over-zone KO in battle 3, restart called in battle 2."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" className="btn-ghost" onClick={() => setMatchModal(null)}>
              Cancel
            </button>
            <SubmitButton
              saving={savingMatch}
              label="Save result"
              savingLabel="Scoring…"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title="Remove entry?"
        message={`${deleteTarget?.bladerName ?? "This blader"} will be pulled from ${tournament.name}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeEntrant}
        busy={busy}
      />
    </div>
  );
}
