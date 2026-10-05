"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { EmptyState, Icon } from "@/components/icons";
import {
  ConfirmDelete,
  LoadingGrid,
  Modal,
  SubmitButton,
  useCollection,
} from "@/lib/client";
import { MATCH_TYPES, TOURNAMENT_STATUSES } from "@/lib/rules";
import type { Tournament } from "@/db/schema";

type TournamentRow = Tournament & { entrants: number; matchCount: number };

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  registration: "bg-volt-400/15 text-volt-400 ring-1 ring-volt-400/30",
  live: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30",
  completed: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30",
};

const EMPTY_FORM = {
  name: "",
  location: "",
  startsAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  format: "3on3",
  matchType: "4-point",
  maxPlayers: 8,
  status: "registration",
  prizePool: "",
  description: "",
};

export default function TournamentsPage() {
  const { items, loading, create, update, remove } =
    useCollection<TournamentRow>("/api/tournaments", "tournaments");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TournamentRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TournamentRow | null>(null);

  const filtered = useMemo(() => {
    return items.filter((tournament) => {
      const matchesQuery =
        !query ||
        tournament.name.toLowerCase().includes(query.toLowerCase()) ||
        (tournament.location ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || tournament.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(tournament: TournamentRow) {
    setEditing(tournament);
    setForm({
      name: tournament.name,
      location: tournament.location ?? "",
      startsAt: new Date(tournament.startsAt).toISOString().slice(0, 16),
      format: tournament.format,
      matchType: tournament.matchType,
      maxPlayers: tournament.maxPlayers,
      status: tournament.status,
      prizePool: tournament.prizePool ?? "",
      description: tournament.description ?? "",
    });
    setFormOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const payload = { ...form, startsAt: new Date(form.startsAt).toISOString() };
    if (editing) {
      await update(editing.id, payload);
    } else {
      await create(payload, {
        ...payload,
        startsAt: new Date(form.startsAt),
        slug: "",
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        entrants: 0,
        matchCount: 0,
        description: form.description || null,
        location: form.location || null,
        prizePool: form.prizePool || null,
      } as Partial<TournamentRow>);
    }
    setSaving(false);
    setFormOpen(false);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Events"
        title="Tournaments"
        description="Create 3on3 events, open registration and push them live."
        action={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Icon name="plus" className="h-4 w-4" /> New tournament
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
          />
          <input
            className="input pl-10"
            placeholder="Search by name or venue…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-52"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {TOURNAMENT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingGrid rows={3} cols={3} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="trophy"
            title={items.length === 0 ? "No tournaments yet" : "No matches for that filter"}
            description={
              items.length === 0
                ? "Spin up your first 3on3 event and start registering bladers."
                : "Try a different search term or clear the status filter."
            }
            action={
              <button type="button" className="btn-primary btn-sm" onClick={openCreate}>
                <Icon name="plus" className="h-3.5 w-3.5" /> New tournament
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tournament) => (
            <div key={tournament.id} className="card card-hover flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`badge ${STATUS_STYLES[tournament.status] ?? "bg-white/10 text-white/60"}`}
                  >
                    {tournament.status}
                  </span>
                  <h3 className="mt-2.5 truncate text-base font-bold text-white">
                    {tournament.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-white/45">
                    {tournament.location ?? "Venue TBA"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => openEdit(tournament)}
                    aria-label="Edit tournament"
                  >
                    <Icon name="edit" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn hover:!border-rose-500/40 hover:!text-rose-300"
                    onClick={() => setPendingDelete(tournament)}
                    aria-label="Delete tournament"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {tournament.description ? (
                <p className="mt-3 line-clamp-2 text-sm text-white/50">
                  {tournament.description}
                </p>
              ) : null}

              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/[0.04] px-2 py-2">
                  <dt className="text-[10px] uppercase tracking-wider text-white/35">
                    Rules
                  </dt>
                  <dd className="mt-0.5 text-xs font-bold text-white">
                    {tournament.matchType === "bestof3"
                      ? "Bo3"
                      : tournament.matchType}
                  </dd>
                </div>
                <div className="rounded-xl bg-white/[0.04] px-2 py-2">
                  <dt className="text-[10px] uppercase tracking-wider text-white/35">
                    Bladers
                  </dt>
                  <dd className="mt-0.5 text-xs font-bold text-white">
                    {tournament.entrants}/{tournament.maxPlayers}
                  </dd>
                </div>
                <div className="rounded-xl bg-white/[0.04] px-2 py-2">
                  <dt className="text-[10px] uppercase tracking-wider text-white/35">
                    Matches
                  </dt>
                  <dd className="mt-0.5 text-xs font-bold text-white">
                    {tournament.matchCount}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <p className="text-xs text-white/40">
                  <Icon name="calendar" className="mr-1 inline h-3.5 w-3.5" />
                  {new Date(tournament.startsAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <Link
                  href={`/dashboard/tournaments/${tournament.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-volt-400 hover:underline"
                >
                  Open <Icon name="chevron" className="h-3.5 w-3.5 -rotate-90" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit tournament" : "New tournament"}
        description="Match rules follow the official Beyblade X rulebook."
        wide
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="t-name">
              Tournament name
            </label>
            <input
              id="t-name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Xtreme Cup — Spring Circuit"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="t-location">
                Venue
              </label>
              <input
                id="t-location"
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Tokyo Metropolitan Gym"
              />
            </div>
            <div>
              <label className="label" htmlFor="t-date">
                Start date & time
              </label>
              <input
                id="t-date"
                type="datetime-local"
                className="input"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="t-matchtype">
                Match type
              </label>
              <select
                id="t-matchtype"
                className="input"
                value={form.matchType}
                onChange={(e) => setForm({ ...form, matchType: e.target.value })}
              >
                {MATCH_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.official ? " ★" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="t-status">
                Status
              </label>
              <select
                id="t-status"
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {TOURNAMENT_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="t-max">
                Max bladers
              </label>
              <input
                id="t-max"
                type="number"
                min={2}
                max={128}
                className="input"
                value={form.maxPlayers}
                onChange={(e) =>
                  setForm({ ...form, maxPlayers: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="t-prize">
              Prize
            </label>
            <input
              id="t-prize"
              className="input"
              value={form.prizePool}
              onChange={(e) => setForm({ ...form, prizePool: e.target.value })}
              placeholder="Champion's belt + DX set"
            />
          </div>

          <div>
            <label className="label" htmlFor="t-desc">
              Description
            </label>
            <textarea
              id="t-desc"
              className="input min-h-24"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deck check 15 minutes before round one. Xtreme Zone finishes score 3 points."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" className="btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <SubmitButton saving={saving} label={editing ? "Save changes" : "Create event"} />
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={Boolean(pendingDelete)}
        title="Delete tournament?"
        message={`"${pendingDelete?.name ?? ""}" and all of its registrations and matches will be permanently removed.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
