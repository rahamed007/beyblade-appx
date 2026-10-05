"use client";

import { useState } from "react";
import { Icon, Spinner } from "@/components/icons";
import { apiRequest } from "@/lib/client";

type Mode = "login" | "register";

export function AuthForm({ defaultMode }: { defaultMode: Mode }) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("admin@bx.gg");
  const [password, setPassword] = useState("letitrip");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/auth/${mode}`, {
        method: "POST",
        body: { email, password, name },
      });
      // Confirm the browser actually kept the session cookie before moving on.
      const session = await apiRequest<{ user: unknown | null }>("/api/auth/session");
      if (!session.user) {
        throw new Error(
          "Signed in, but your browser blocked the session cookie. Open the preview in a new tab and try again.",
        );
      }
      // Hard navigation so the fresh cookie is sent with the very next request.
      window.location.assign("/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  function useDemo() {
    setMode("login");
    setEmail("admin@bx.gg");
    setPassword("letitrip");
  }

  return (
    <div className="card p-6 shadow-2xl">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-black/40 p-1">
        {(["login", "register"] as Mode[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={`cursor-pointer rounded-lg py-2 text-sm font-semibold transition ${
              mode === value
                ? "bg-gradient-to-r from-blaze-500 to-blaze-400 text-white shadow"
                : "text-white/50 hover:text-white"
            }`}
          >
            {value === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "register" ? (
          <div>
            <label className="label" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kai Sumeragi"
              required
            />
          </div>
        ) : null}

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@arena.gg"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">
            <Icon name="x" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
          {busy ? (
            <>
              <Spinner /> {mode === "login" ? "Entering the arena…" : "Creating…"}
            </>
          ) : mode === "login" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={useDemo}
        className="btn-volt mt-3 w-full"
        disabled={busy}
      >
        <Icon name="sparkles" className="h-4 w-4" /> Use demo organizer
      </button>
    </div>
  );
}
