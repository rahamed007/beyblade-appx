"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Spinner } from "@/components/icons";
import { useToast } from "@/components/toast";

export async function apiRequest<T>(
  url: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  const text = await response.text();
  let payload: unknown = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }
  if (!response.ok) {
    const message =
      (payload as { error?: string })?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

type CollectionOptions<T> = {
  url: string;
  listKey: string;
  initial?: T[];
  enabled?: boolean;
};

type CollectionArgs<T> = [
  url: string,
  listKey: string,
  options?: { initial?: T[]; enabled?: boolean },
];

/**
 * Loads a collection and applies optimistic create / update / remove with
 * automatic rollback + toast when the server rejects the change.
 */
export function useCollection<T extends { id: number }>(...args: CollectionArgs<T>) {
  const [url, listKey, options] = args;
  const initial = options?.initial ?? [];
  const enabled = options?.enabled ?? true;
  const toast = useToast();
  const [items, setItems] = useState<T[]>(initial);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiRequest<Record<string, T[]>>(url)
      .then((data) => {
        if (cancelled) return;
        setItems(data[listKey] ?? []);
        loadedRef.current = true;
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url, listKey, enabled]);

  const create = useCallback(
    async (payload: unknown, optimistic?: Partial<T>) => {
      const tempId = -Date.now();
      const optimisticItem = optimistic
        ? ({ ...optimistic, id: tempId } as T)
        : null;
      if (optimisticItem) setItems((prev) => [optimisticItem, ...prev]);
      try {
        const data = await apiRequest<Record<string, T>>(url, {
          method: "POST",
          body: payload,
        });
        const created = Object.values(data)[0] as T | undefined;
        setItems((prev) => {
          const withoutTemp = prev.filter((i) => i.id !== tempId);
          return created ? [created, ...withoutTemp] : withoutTemp;
        });
        toast.push("Saved to the arena.");
        return created ?? null;
      } catch (err) {
        if (optimisticItem) {
          setItems((prev) => prev.filter((i) => i.id !== tempId));
        }
        toast.push((err as Error).message, "error");
        return null;
      }
    },
    [toast, url],
  );

  const update = useCallback(
    async (id: number, payload: unknown) => {
      const snapshot = items;
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? ({ ...(item as unknown as Record<string, unknown>), ...(payload as Record<string, unknown>) } as T)
            : item,
        ),
      );
      try {
        const data = await apiRequest<Record<string, T>>(`${url}/${id}`, {
          method: "PATCH",
          body: payload,
        });
        const updated = Object.values(data)[0] as T | undefined;
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? (updated ??
                  ({
                    ...(item as unknown as Record<string, unknown>),
                    ...(payload as Record<string, unknown>),
                  } as T))
              : item,
          ),
        );
        toast.push("Updated.");
        return updated ?? null;
      } catch (err) {
        setItems(snapshot);
        toast.push((err as Error).message, "error");
        return null;
      }
    },
    [items, toast, url],
  );

  const remove = useCallback(
    async (id: number) => {
      const snapshot = items;
      setItems((prev) => prev.filter((item) => item.id !== id));
      try {
        await apiRequest(`${url}/${id}`, { method: "DELETE" });
        toast.push("Deleted.");
        return true;
      } catch (err) {
        setItems(snapshot);
        toast.push((err as Error).message, "error");
        return false;
      }
    },
    [items, toast, url],
  );

  return { items, setItems, loading, error, create, update, remove, loaded: loadedRef.current };
}

export function LoadingGrid({ rows = 4, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="skeleton h-3 w-1/3" />
          <div className="skeleton mt-4 h-6 w-2/3" />
          <div className="skeleton mt-3 h-3 w-full" />
          <div className="skeleton mt-2 h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-3 w-1/5" />
          </div>
          <div className="skeleton h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SubmitButton({
  saving,
  label = "Save",
  savingLabel = "Saving…",
  className = "btn-primary",
}: {
  saving: boolean;
  label?: string;
  savingLabel?: string;
  className?: string;
}) {
  return (
    <button type="submit" className={className} disabled={saving}>
      {saving ? (
        <>
          <Spinner /> {savingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <div
        className={`pop-in relative z-10 my-auto w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl border border-white/10 bg-arena-900/95 p-6 shadow-2xl`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-white/50">{description}</p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDelete({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-white/60">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? <Spinner /> : null} Delete
        </button>
      </div>
    </Modal>
  );
}
