"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "@/components/icons";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
};

type ToastContextValue = {
  push: (message: string, tone?: Toast["tone"]) => void;
};

const ToastContext = createContext<ToastContextValue>({ push: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pop-in pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
              toast.tone === "error"
                ? "border-rose-500/30 bg-rose-950/80 text-rose-100"
                : toast.tone === "info"
                  ? "border-volt-400/30 bg-slate-900/85 text-volt-400"
                  : "border-emerald-500/30 bg-emerald-950/80 text-emerald-100"
            }`}
          >
            <Icon
              name={toast.tone === "error" ? "x" : toast.tone === "info" ? "bolt" : "check"}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="cursor-pointer text-current/60 transition hover:text-current"
              aria-label="Dismiss"
            >
              <Icon name="x" className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
