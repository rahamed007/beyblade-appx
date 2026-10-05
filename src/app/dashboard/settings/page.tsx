"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { BeyGlyph, Icon, Spinner } from "@/components/icons";
import { useToast } from "@/components/toast";
import { apiRequest } from "@/lib/client";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function load() {
    try {
      const data = await apiRequest<{ user: SessionUser }>("/api/auth/session");
      setUser(data.user);
      setProfile({ name: data.user.name, email: data.user.email });
    } catch (err) {
      toast.push((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  if (loading && !user) {
    void load();
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const data = await apiRequest<{ user: SessionUser }>("/api/profile", {
        method: "PATCH",
        body: profile,
      });
      setUser(data.user);
      toast.push("Profile updated.");
    } catch (err) {
      toast.push((err as Error).message, "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await apiRequest("/api/profile", {
        method: "PATCH",
        body: passwords,
      });
      setPasswords({ currentPassword: "", newPassword: "" });
      toast.push("Password changed.");
    } catch (err) {
      toast.push((err as Error).message, "error");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your organizer profile and password."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <BeyGlyph className="h-16 w-16" />
            <h2 className="mt-4 text-lg font-bold text-white">
              {user?.name ?? "Loading…"}
            </h2>
            <p className="text-sm text-white/45">{user?.email}</p>
            <span className="badge mt-3 bg-blaze-500/15 text-blaze-400">
              {user?.role ?? "organizer"}
            </span>
            {user?.createdAt ? (
              <p className="mt-4 text-xs text-white/35">
                Member since{" "}
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </div>
          <ul className="mt-6 space-y-2 border-t border-white/10 pt-4 text-xs text-white/45">
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-3.5 w-3.5 text-emerald-400" />
              Full CRUD on tournaments & bladers
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-3.5 w-3.5 text-emerald-400" />
              Judge matches & publish standings
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-3.5 w-3.5 text-emerald-400" />
              Manage the deck catalog
            </li>
          </ul>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={saveProfile} className="card p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">
              Profile
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="s-name">
                  Display name
                </label>
                <input
                  id="s-name"
                  className="input"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="s-email">
                  Email
                </label>
                <input
                  id="s-email"
                  type="email"
                  className="input"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button type="submit" className="btn-primary" disabled={savingProfile}>
                {savingProfile ? (
                  <>
                    <Spinner /> Saving…
                  </>
                ) : (
                  "Save profile"
                )}
              </button>
            </div>
          </form>

          <form onSubmit={savePassword} className="card p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">
              Password
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="s-current">
                  Current password
                </label>
                <input
                  id="s-current"
                  type="password"
                  className="input"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="s-new">
                  New password
                </label>
                <input
                  id="s-new"
                  type="password"
                  className="input"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  minLength={6}
                  required
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button type="submit" className="btn-ghost" disabled={savingPassword}>
                {savingPassword ? (
                  <>
                    <Spinner /> Updating…
                  </>
                ) : (
                  "Change password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
