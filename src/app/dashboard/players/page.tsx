"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { EmptyState, Icon, Spinner } from "@/components/icons";
import {
  ConfirmDelete,
  LoadingGrid,
  Modal,
  SubmitButton,
  useCollection,
} from "@/lib/client";
import type { Player } from "@/db/schema";

const EMPTY_FORM = {
  bladerName: "",
  realName: "",
  region: "",
  team: "",
  launchStyle: "right",
  signatureMove: "",
  bio: "",
};

function Avatar({ name }: { name: string }) {
  const letters = name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "BX";
  const hue = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ring-1 ring-white/10"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 85% 52%), hsl(${(hue + 60) % 360} 80% 42%))`,
      }}
    >
      {letters}
    </div>
  );
}

export default function PlayersPage() {
  const { items, loading, create, update, remove } =
    useCollection<Player>("/api/players", "players");

  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Player | null>(null);

  const filtered = useMemo(
    () =>
      items.filter((player) => {
        const q = query.toLowerCase();
        return (
          !q ||
          player.bladerName.toLowerCase().includes(q) ||
          (player.realName ?? "").toLowerCase().includes(q) ||
          (player.team ?? "").toLowerCase().includes(q) ||
          (player.region ?? "").toLowerCase().includes(q)
        );
      }),
    [items, query],
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(player: Player) {
    setEditing(player);
    setForm({
      bladerName: player.bladerName,
      realName: player.realName ?? "",
      region: player.region ?? "",
      team: player.team ?? "",
      launchStyle: player.launchStyle,
      signatureMove: player.signatureMove ?? "",
      bio: player.bio ?? "",
    });
    setFormOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const payload = { ...form };
    if (editing) {
      await update(editing.id, payload);
    } else {
      await create(payload, {
        ...payload,
        wins: 0,
        losses: 0,
        battleWins: 0,
        battleLosses: 0,
        points: 0,
        realName: form.realName || null,
        region: form.region || null,
        team: form.team || null,
        signatureMove: form.signatureMove || null,
        bio: form.bio || null,
      } as Partial<Player>);
    }
    setSaving(false);
    setFormOpen(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Roster"
        title="Bladers"
        description="Player profiles, career records and signature gear."
        action={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Icon name="plus" className="h-4 w-4" /> Add blader
          </button>
        }
      />

      <div className="relative mb-5 max-w-md">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
        />
        <input
          className="input pl-10"
          placeholder="Search blader, real name, team…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingGrid rows={3} cols={3} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="users"
            title={items.length === 0 ? "No bladers on the roster" : "No bladers found"}
            description={
              items.length === 0
                ? "Add your first blader to start building tournaments."
                : "Try another search term."
            }
            action={
              <button type="button" className="btn-primary btn-sm" onClick={openCreate}>
                <Icon name="plus" className="h-3.5 w-3.5" /> Add blader
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((player) => {
            const total = player.wins + player.losses;
            const winRate = total ? Math.round((player.wins / total) * 100) : 0;
            return (
              <div key={player.id} className="card card-hover p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={player.bladerName} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-white">
                      {player.bladerName}
                    </h3>
                    <p className="truncate text-xs text-white/45">
                      {player.realName ?? "—"}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => openEdit(player)}
                      aria-label="Edit blader"
                    >
                      <Icon name="edit" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn hover:!border-rose-500/40 hover:!text-rose-300"
                      onClick={() => setPendingDelete(player)}
                      aria-label="Delete blader"
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="badge bg-volt-400/10 text-volt-400">
                    {player.launchStyle === "left" ? "Left spin" : "Right spin"}
                  </span>
                  {player.team ? (
                    <span className="badge bg-white/[0.07] text-white/60">
                      {player.team}
                    </span>
                  ) : null}
                  {player.region ? (
                    <span className="badge bg-white/[0.07] text-white/60">
                      {player.region}
                    </span>
                  ) : null}
                </div>

                {player.signatureMove ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-blaze-400">
                    <Icon name="bolt" className="mr-1 inline h-3 w-3" />
                    {player.signatureMove}
                  </p>
                ) : null}

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
                  <div>
                    <p className="text-lg font-black text-white">
                      {player.wins}–{player.losses}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/35">
                      Match record
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-emerald-300">{winRate}%</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/35">
                      Win rate
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">
                      {player.battleWins}–{player.battleLosses}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/35">
                      Battles
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit blader" : "Add blader"}
        description="Career records update automatically from judged matches."
        wide
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="p-name">
                Blader name
              </label>
              <input
                id="p-name"
                className="input"
                value={form.bladerName}
                onChange={(e) => setForm({ ...form, bladerName: e.target.value })}
                placeholder="DranSlayer"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="p-real">
                Real name
              </label>
              <input
                id="p-real"
                className="input"
                value={form.realName}
                onChange={(e) => setForm({ ...form, realName: e.target.value })}
                placeholder="Kenta Ishida"
              />
            </div>
            <div>
              <label className="label" htmlFor="p-team">
                Team
              </label>
              <input
                id="p-team"
                className="input"
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
                placeholder="Gear Edge"
              />
            </div>
            <div>
              <label className="label" htmlFor="p-region">
                Region
              </label>
              <input
                id="p-region"
                className="input"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="Tokyo"
              />
            </div>
            <div>
              <label className="label" htmlFor="p-style">
                Launch direction
              </label>
              <select
                id="p-style"
                className="input"
                value={form.launchStyle}
                onChange={(e) => setForm({ ...form, launchStyle: e.target.value })}
              >
                <option value="right">Right spin</option>
                <option value="left">Left spin</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-move">
                Signature move
              </label>
              <input
                id="p-move"
                className="input"
                value={form.signatureMove}
                onChange={(e) => setForm({ ...form, signatureMove: e.target.value })}
                placeholder="Spiral Xtreme Shoot"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="p-bio">
              Bio
            </label>
            <textarea
              id="p-bio"
              className="input min-h-24"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Launch angle, favourite combo, titles…"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" className="btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <SubmitButton saving={saving} label={editing ? "Save blader" : "Add blader"} />
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={Boolean(pendingDelete)}
        title="Delete blader?"
        message={`${pendingDelete?.bladerName ?? ""} will be removed along with their registrations and match history.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await remove(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
