"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BeyGlyph, Icon } from "@/components/icons";
import { apiRequest } from "@/lib/client";

export type ShellUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/dashboard/tournaments", label: "Tournaments", icon: "trophy" },
  { href: "/dashboard/players", label: "Bladers", icon: "users" },
  { href: "/dashboard/matches", label: "Matches", icon: "swords" },
  { href: "/dashboard/beys", label: "Deck Catalog", icon: "disc" },
  { href: "/dashboard/rules", label: "Rules & Scoring", icon: "book" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

export function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  async function signOut() {
    setSigningOut(true);
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      window.location.assign("/login");
    } catch {
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-arena-950/95 backdrop-blur-xl transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <BeyGlyph className="h-10 w-10 spin-slow" />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white">
              Beyblade<span className="text-blaze-500">X</span>
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              Tournament HQ
            </p>
          </div>
          <button
            type="button"
            className="icon-btn ml-auto lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`nav-link ${isActive(item.href) ? "nav-link-active" : ""}`}
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blaze-500 to-volt-500 text-xs font-bold text-white">
              {initials || "BX"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] uppercase tracking-wider text-white/40">
                {user.role}
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="icon-btn"
              title="Sign out"
              aria-label="Sign out"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-arena-950/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <button
            type="button"
            className="icon-btn lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Season 2026 · 3on3 Official
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/dashboard/tournaments" className="btn-primary btn-sm">
              <Icon name="plus" className="h-3.5 w-3.5" /> New event
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="fade-in mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-blaze-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-black tracking-tight text-white lg:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-white/50">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}
