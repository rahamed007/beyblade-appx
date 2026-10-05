import Link from "next/link";
import { redirect } from "next/navigation";
import { BeyGlyph, Icon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";

const FEATURES = [
  {
    icon: "trophy",
    title: "Create events in seconds",
    body: "Spin up 3on3 brackets with 4-, 5-, 7-point or Best-of-3 match rules, entry caps and prize pools.",
  },
  {
    icon: "shield",
    title: "Legal deck enforcement",
    body: "Deck validator blocks duplicate blades, ratchets and bits before a blader ever reaches the judge table.",
  },
  {
    icon: "swords",
    title: "Judge match results",
    body: "Log Survivor, Burst, Over-Zone and Xtreme-Zone finishes — points are scored automatically.",
  },
  {
    icon: "chart",
    title: "Live standings",
    body: "Round-by-round tables, career blader records and instant leaderboards across every circuit.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(245,65,42,0.22),transparent_70%)]" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-3">
          <BeyGlyph className="h-9 w-9 spin-slow" />
          <p className="text-sm font-black uppercase tracking-[0.22em]">
            Beyblade<span className="text-blaze-500">X</span> HQ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost btn-sm">
            Sign in
          </Link>
          <Link href="/login?mode=register" className="btn-primary btn-sm">
            Create account
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 lg:grid-cols-2 lg:pt-12">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blaze-500/30 bg-blaze-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-blaze-400">
            <Icon name="bolt" className="h-3.5 w-3.5" /> Official 3on3 ruleset
          </div>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Run your
            <span className="bg-gradient-to-r from-blaze-400 via-blaze-500 to-volt-400 bg-clip-text text-transparent">
              {" "}
              Beyblade X tournament
            </span>{" "}
            like a pro circuit.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
            Everything an organizer needs: tournaments, blader profiles, legal deck
            checks, judged match scoring and live standings — all in one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary px-6 py-3">
              <Icon name="bolt" className="h-4 w-4" /> Launch the dashboard
            </Link>
            <Link href="/login?mode=register" className="btn-ghost px-6 py-3">
              Register as organizer
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/40">
            <span className="inline-flex items-center gap-2">
              <Icon name="check" className="h-3.5 w-3.5 text-emerald-400" /> Demo login
            </span>
            <code className="rounded-md bg-white/[0.06] px-2 py-1 text-white/70">
              admin@bx.gg
            </code>
            <code className="rounded-md bg-white/[0.06] px-2 py-1 text-white/70">
              letitrip
            </code>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-blaze-500/25 to-volt-500/20 blur-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/arena.jpg"
            alt="Two Beyblade X tops colliding inside a battle stadium"
            className="w-full rounded-3xl border border-white/10 object-cover shadow-2xl"
          />
          <div className="absolute -bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-arena-900/90 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/40">
              <span>Xtreme Cup · Grand Final</span>
              <span className="text-blaze-400">Live</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-bold">
              <span>DranSlayer</span>
              <span className="rounded-lg bg-white/10 px-2 py-0.5">4 – 2</span>
              <span>NeoPhoenix</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card card-hover p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-blaze-400 ring-1 ring-white/10">
                <Icon name={feature.icon} className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/35">
        Let it rip! Beyblade X Tournament HQ · unofficial fan tool for local circuits
      </footer>
    </div>
  );
}
