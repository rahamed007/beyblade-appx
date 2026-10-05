"use client";

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
import { BEY_TYPES, SPIN_DIRECTIONS } from "@/lib/rules";
import type { Beyblade } from "@/db/schema";

const EMPTY_FORM = {
  name: "",
  blade: "",
  ratchet: "",
  bit: "",
  type: "attack",
  spin: "right",
  notes: "",
};

const TYPE_STYLES: Record<string, string> = {
  attack: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25",
  defense: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
  stamina: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  balance: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
};

export default function BeyCatalogPage() {
  const { items, loading, create, update, remove } =
    useCollection<Beyblade>("/api/beyblades", "beyblades");

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Beyblade | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Beyblade | null>(null);

  const filtered = useMemo(
    () =>
      items.filter((bey) => {
        const q = query.toLowerCase();
        const queryOk =
          !q ||
          bey.name.toLowerCase().includes(q) ||
          bey.blade.toLowerCase().includes(q) ||
          bey.ratchet.toLowerCase().includes(q) ||
          bey.bit.toLowerCase().includes(q);
        const typeOk = typeFilter === "all" || bey.type === typeFilter;
        return queryOk && typeOk;
      }),
    [items, query, typeFilter],
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(bey: Beyblade) {
    setEditing(bey);
    setForm({
      name: bey.name,
      blade: bey.blade,
      ratchet: bey.ratchet,
      bit: bey.bit,
      type: bey.type,
      spin: bey.spin,
      notes: bey.notes ?? "",
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
        notes: form.notes || null,
      } as Partial<Beyblade>);
    }
    setSaving(false);
    setFormOpen(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Garage"
        title="Deck catalog"
        description="Every combo available for deck registration — blade, ratchet and bit."
        action={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Icon name="plus" className="h-4 w-4" /> Add combo
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
            placeholder="Search combo, blade, bit…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-48"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All types</option>
          {BEY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type[0].toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingGrid rows={4} cols={4} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="disc"
            title={items.length === 0 ? "The garage is empty" : "No combos found"}
            description={
              items.length === 0
                ? "Add your first Bey combo so bladers can register legal decks."
                : "Try another search or clear the type filter."
            }
            action={
              <button type="button" className="btn-primary btn-sm" onClick={openCreate}>
                <Icon name="plus" className="h-3.5 w-3.5" /> Add combo
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((bey) => (
            <div key={bey.id} className="card card-hover flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-white">{bey.name}</h3>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">
                    {bey.spin} spin
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="icon-btn h-7 w-7"
                    onClick={() => openEdit(bey)}
                    aria-label="Edit combo"
                  >
                    <Icon name="edit" className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-7 w-7 hover:!border-rose-500/40 hover:!text-rose-300"
                    onClick={() => setPendingDelete(bey)}
                    aria-label="Delete combo"
                  >
                    <Icon name="trash" className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <span
                className={`badge mt-3 w-fit capitalize ${TYPE_STYLES[bey.type] ?? "bg-white/10"}`}
              >
                {bey.type}
              </span>

              <dl className="mt-4 space-y-1.5 border-t border-white/5 pt-3 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-white/35">Blade</dt>
                  <dd className="font-semibold text-white/85">{bey.blade}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-white/35">Ratchet</dt>
                  <dd className="font-semibold text-white/85">{bey.ratchet}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-white/35">Bit</dt>
                  <dd className="font-semibold text-white/85">{bey.bit}</dd>
                </div>
              </dl>

              {bey.notes ? (
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/45">
                  {bey.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit combo" : "Add combo"}
        description="Combos appear in the deck builder when registering bladers."
        wide
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="b-name">
              Full combo name
            </label>
            <input
              id="b-name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dran Sword 3-60LF"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="b-blade">
                Blade
              </label>
              <input
                id="b-blade"
                className="input"
                value={form.blade}
                onChange={(e) => setForm({ ...form, blade: e.target.value })}
                placeholder="DranSword"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="b-ratchet">
                Ratchet
              </label>
              <input
                id="b-ratchet"
                className="input"
                value={form.ratchet}
                onChange={(e) => setForm({ ...form, ratchet: e.target.value })}
                placeholder="3-60"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="b-bit">
                Bit
              </label>
              <input
                id="b-bit"
                className="input"
                value={form.bit}
                onChange={(e) => setForm({ ...form, bit: e.target.value })}
                placeholder="LF"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="b-type">
                Type
              </label>
              <select
                id="b-type"
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {BEY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type[0].toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="b-spin">
                Spin direction
              </label>
              <select
                id="b-spin"
                className="input"
                value={form.spin}
                onChange={(e) => setForm({ ...form, spin: e.target.value })}
              >
                {SPIN_DIRECTIONS.map((spin) => (
                  <option key={spin} value={spin}>
                    {spin[0].toUpperCase() + spin.slice(1)} spin
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="b-notes">
              Notes
            </label>
            <textarea
              id="b-notes"
              className="input min-h-20"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Play style, counters, launch tips…"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" className="btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <SubmitButton saving={saving} label={editing ? "Save combo" : "Add combo"} />
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={Boolean(pendingDelete)}
        title="Delete combo?"
        message={`${pendingDelete?.name ?? ""} will be removed from the catalog.`}
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
