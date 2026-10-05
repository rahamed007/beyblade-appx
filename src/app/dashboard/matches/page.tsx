"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { EmptyState, Icon, Spinner } from "@/components/icons";
import { useToast } from "@/components/toast";
import {
  ConfirmDelete,
  LoadingRows,
  Modal,
  SubmitButton,
  apiRequest,
} from "@/lib/client";
import { FINISH_TYPES } from "@/lib/rules";
import type { Match, Player, Tournament } from "@/db/schema";
import type { MatchRow } from "@/app/api/matches/route";

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-white/10 text-white/60",
  live: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30",
  completed: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30",
};

const EMPTY_FORM = {
  tournamentId: "",
  round: 1,
  tableNumber: 1,
  playerAId: "",
  playerBId: "",
  status: "scheduled",
  notes: "",
};

export default function MatchesPage() {
  const toast = useToast();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tournamentFilter, setTournamentFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<MatchRow | null>(null);

  const [judge, setJudge] = useState<MatchRow | null>(null);
  const [judgeForm, setJudgeForm] = useState({
    status: "completed",
    scoreA: 0,
    scoreB: 0,
    battlesA: 0,
    battlesB: 0,
    finishType: "xtreme",
    notes: "",
  });
  const [savingJudge, setSavingJudge] = useState(false);

  const load = useCallback(async () => {
    try {
      const [matchList, tournamentList, playerList] = await Promise.all([
        apiRequest<{ matches: MatchRow[] }>("/api/matches"),
        apiRequest<{ tournaments: Tournament[] }>("/api/tournaments"),
        apiRequest<{ players: Player[] }>("/api/players"),
      ]);
      setMatches(matchList.matches);
      setTournaments(tournamentList.tournaments);
      setPlayers(playerList.players);
    } catch (err) {
      toast.push((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      matches.filter((match) => {
        const statusOk = statusFilter === "all" || match.status === statusFilter;
        const tournamentOk =
          tournamentFilter === "all" ||
          String(match.tournamentId) === tournamentFilter;
        return statusOk && tournamentOk;
      }),
    [matches, statusFilter, tournamentFilter],
  );

  async function createMatch(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      tournamentId: Number(form.tournamentId),
      playerAId: Number(form.playerAId),
      playerBId: Number(form.playerBId),
    };
    try {
      const created = await apiRequest<{ match: Match }>("/api/matches", {
        method: "POST",
        body: payload,
      });
      const playerA = players.find((p) => p.id === created.match.playerAId);
      const playerB = players.find((p) => p.id === created.match.playerBId);
      const tournament = tournaments.find((t) => t.id === created.match.tournamentId);
      setMatches((prev) => [
        {
          ...created.match,
          tournamentName: tournament?.name ?? "",
          matchType: tournament?.matchType ?? "4-point",
          playerAName: playerA?.bladerName ?? "Blader A",
          playerBName: playerB?.bladerName ?? "Blader B",
          playedAt: null,
        },
        ...prev,
      ]);
      toast.push("Match scheduled.");
      setFormOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.push((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  function openJudge(match: MatchRow) {
    setJudge(match);
    setJudgeForm({
      status: match.status,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      battlesA: match.battlesA,
      battlesB: match.battlesB,
      finishType: match.finishType ?? "xtreme",
      notes: match.notes ?? "",
    });
  }

  async function saveJudge(event: React.FormEvent) {
    event.preventDefault();
    if (!judge) return;
    setSavingJudge(true);
    const snapshot = matches;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === judge.id
          ? {
              ...m,
              scoreA: judgeForm.scoreA,
              scoreB: judgeForm.scoreB,
              battlesA: judgeForm.battlesA,
              battlesB: judgeForm.battlesB,
              status: judgeForm.status,
              finishType: judgeForm.status === "completed" ? judgeForm.finishType : null,
              notes: judgeForm.notes || null,
            }
          : m,
      ),
    );
    try {
      const result = await apiRequest<{ match: Match }>(`/api/matches/${judge.id}`, {
        method: "PATCH",
        body: {
          ...judgeForm,
          finishType: judgeForm.status === "completed" ? judgeForm.finishType : null,
          winnerId:
            judgeForm.scoreA === judgeForm.scoreB
              ? null
              : judgeForm.scoreA > judgeForm.scoreB
                ? judge.playerAId
                : judge.playerBId,
        },
      });
      setMatches((prev) =>
        prev.map((m) =>
          m.id === judge.id
            ? {
                ...m,
                winnerId: result.match.winnerId,
                status: result.match.status,
              }
            : m,
        ),
      );
      toast.push("Result recorded — standings updated.");
      setJudge(null);
    } catch (err) {
      setMatches(snapshot);
      toast.push((err as Error).message, "error");
    } finally {
      setSavingJudge(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const snapshot = matches;
    setMatches((prev) => prev.filter((m) => m.id !== pendingDelete.id));
    setPendingDelete(null);
    try {
      await apiRequest(`/api/matches/${pendingDelete.id}`, { method: "DELETE" });
      toast.push("Match deleted.");
    } catch (err) {
      setMatches(snapshot);
      toast.push((err as Error).message, "error");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Match desk"
        title="Matches"
        description="Schedule tables, judge results and keep standings live."
        action={
          <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>
            <Icon name="plus" className="h-4 w-4" /> New match
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <select
          className="input sm:w-64"
          value={tournamentFilter}
          onChange={(e) => setTournamentFilter(e.target.value)}
        >
          <option value="all">All tournaments</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
        <select
          className="input sm:w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="card p-5">
          <LoadingRows rows={6} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="swords"
            title="No matches here"
            description="Schedule a match between two registered bladers to get started."
            action={
              <button type="button" className="btn-primary btn-sm" onClick={() => setFormOpen(true)}>
                <Icon name="plus" className="h-3.5 w-3.5" /> Schedule match
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="table-head">Event</th>
                  <th className="table-head">Table</th>
                  <th className="table-head">Match-up</th>
                  <th className="table-head">Result</th>
                  <th className="table-head">Status</th>
                  <th className="table-head text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((match) => (
                  <tr key={match.id} className="transition hover:bg-white/[0.03]">
                    <td className="table-cell">
                      <p className="font-semibold text-white">{match.tournamentName}</p>
                      <p className="text-xs text-white/40">
                        Round {match.round} · {match.matchType}
                      </p>
                    </td>
                    <td className="table-cell text-white/60">T{match.tableNumber}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            match.winnerId === match.playerAId
                              ? "text-emerald-300"
                              : "text-white/75"
                          }`}
                        >
                          {match.playerAName}
                        </span>
                        <span className="text-white/30">vs</span>
                        <span
                          className={`text-sm font-bold ${
                            match.winnerId === match.playerBId
                              ? "text-emerald-300"
                              : "text-white/75"
                          }`}
                        >
                          {match.playerBName}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {match.status === "completed" ? (
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-white/10 px-2 py-0.5 text-sm font-black">
                            {match.scoreA}–{match.scoreB}
                          </span>
                          <span className="text-xs text-white/45">
                            {match.finishType}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-white/35">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_STYLES[match.status] ?? "bg-white/10"}`}>
                        {match.status === "live" ? (
                          <>
                            <Spinner className="h-2.5 w-2.5" /> live
                          </>
                        ) : (
                          match.status
                        )}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          className="btn-volt btn-sm"
                          onClick={() => openJudge(match)}
                        >
                          <Icon name="target" className="h-3.5 w-3.5" /> Judge
                        </button>
                        <button
                          type="button"
                          className="icon-btn hover:!border-rose-500/40 hover:!text-rose-300"
                          onClick={() => setPendingDelete(match)}
                          aria-label="Delete match"
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
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Schedule a match"
        description="Both bladers should already be registered on the event."
        wide
      >
        <form onSubmit={createMatch} className="space-y-4">
          <div>
            <label className="label" htmlFor="m-tournament">
              Tournament
            </label>
            <select
              id="m-tournament"
              className="input"
              value={form.tournamentId}
              onChange={(e) => setForm({ ...form, tournamentId: e.target.value })}
              required
            >
              <option value="">Select an event…</option>
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name} ({tournament.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="m-round">
                Round
              </label>
              <input
                id="m-round"
                type="number"
                min={1}
                className="input"
                value={form.round}
                onChange={(e) => setForm({ ...form, round: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label" htmlFor="m-table">
                Table
              </label>
              <input
                id="m-table"
                type="number"
                min={1}
                className="input"
                value={form.tableNumber}
                onChange={(e) => setForm({ ...form, tableNumber: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label" htmlFor="m-status">
                Status
              </label>
              <select
                id="m-status"
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="m-a">
                Blader A (left launch)
              </label>
              <select
                id="m-a"
                className="input"
                value={form.playerAId}
                onChange={(e) => setForm({ ...form, playerAId: e.target.value })}
                required
              >
                <option value="">Select blader…</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.bladerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="m-b">
                Blader B (right launch)
              </label>
              <select
                id="m-b"
                className="input"
                value={form.playerBId}
                onChange={(e) => setForm({ ...form, playerBId: e.target.value })}
                required
              >
                <option value="">Select blader…</option>
                {players
                  .filter((player) => String(player.id) !== form.playerAId)
                  .map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.bladerName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="m-notes">
              Notes
            </label>
            <input
              id="m-notes"
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Deck check at 11:45, bring sealed case."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" className="btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <SubmitButton saving={saving} label="Schedule match" savingLabel="Scheduling…" />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(judge)}
        onClose={() => setJudge(null)}
        title="Judge match"
        description={
          judge
            ? `${judge.playerAName} vs ${judge.playerBName} · ${judge.tournamentName}`
            : undefined
        }
      >
        <form onSubmit={saveJudge} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="j-a">
                {judge?.playerAName} points
              </label>
              <input
                id="j-a"
                type="number"
                min={0}
                max={21}
                className="input"
                value={judgeForm.scoreA}
                onChange={(e) =>
                  setJudgeForm({ ...judgeForm, scoreA: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="j-b">
                {judge?.playerBName} points
              </label>
              <input
                id="j-b"
                type="number"
                min={0}
                max={21}
                className="input"
                value={judgeForm.scoreB}
                onChange={(e) =>
                  setJudgeForm({ ...judgeForm, scoreB: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="j-ba">
                Battles won ({judge?.playerAName?.slice(0, 6) ?? "A"})
              </label>
              <input
                id="j-ba"
                type="number"
                min={0}
                max={21}
                className="input"
                value={judgeForm.battlesA}
                onChange={(e) =>
                  setJudgeForm({ ...judgeForm, battlesA: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="j-bb">
                Battles won ({judge?.playerBName?.slice(0, 6) ?? "B"})
              </label>
              <input
                id="j-bb"
                type="number"
                min={0}
                max={21}
                className="input"
                value={judgeForm.battlesB}
                onChange={(e) =>
                  setJudgeForm({ ...judgeForm, battlesB: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="j-finish">
                Final battle result
              </label>
              <select
                id="j-finish"
                className="input"
                value={judgeForm.finishType}
                onChange={(e) =>
                  setJudgeForm({ ...judgeForm, finishType: e.target.value })
                }
              >
                {FINISH_TYPES.map((finish) => (
                  <option key={finish.value} value={finish.value}>
                    {finish.label} ({finish.points} pt{finish.points === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="j-status">
                Status
              </label>
              <select
                id="j-status"
                className="input"
                value={judgeForm.status}
                onChange={(e) => setJudgeForm({ ...judgeForm, status: e.target.value })}
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="j-notes">
              Judge notes
            </label>
            <textarea
              id="j-notes"
              className="input min-h-20"
              value={judgeForm.notes}
              onChange={(e) => setJudgeForm({ ...judgeForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" className="btn-ghost" onClick={() => setJudge(null)}>
              Cancel
            </button>
            <SubmitButton saving={savingJudge} label="Save result" savingLabel="Scoring…" />
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={Boolean(pendingDelete)}
        title="Delete match?"
        message="Blader records will be recalculated after deletion."
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
