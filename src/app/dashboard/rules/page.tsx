import { PageHeader } from "@/components/dashboard-shell";
import { Icon } from "@/components/icons";
import { FINISH_TYPES, MATCH_TYPES } from "@/lib/rules";

const PRE_MATCH = [
  {
    title: "1. Match start",
    body: "Arrive on time with all equipment. No outside help, no leaving the area without asking the judge.",
  },
  {
    title: "2. Select position",
    body: "The judge picks one blader at random (coin flip, die roll or rock-paper-scissors). That blader picks left or right launch side; the other takes the remaining side.",
  },
  {
    title: "3. Select Beys",
    body: "Both bladers secretly order their 3 Beys within 1 minute. Turn away so your opponent cannot peek, then tell the judge you are ready.",
  },
  {
    title: "4. Judge check",
    body: "Beys and launchers are inspected. Fail inspection twice in one match and you lose. Intentional cheating is an instant disqualification.",
  },
];

const EACH_BATTLE = [
  {
    title: "1. Present Beys",
    body: "Show top and bottom of your Bey. You may adjust your Bey once per battle (modes or part rotation) — announce it to your opponent and the judge first.",
  },
  {
    title: "2. Ready for launch",
    body: "Attach your Bey to the launcher and hold it inside the legal launch range for your side.",
  },
  {
    title: "3. Launch",
    body: "Both bladers launch on the count of “3, 2, 1… Go Shoot!” (or “Let It Rip!”).",
  },
  {
    title: "4. Resolve battle",
    body: "Let the Beys battle until one or both stop spinning inside the battle zone.",
  },
  {
    title: "5. Battle result",
    body: "The judge calls the win type and awards points based on how the battle was won.",
  },
];

const LEGAL = [
  "PhoenixWing 3-60R · WizardRod 1-60L · DranBuster 5-60LR",
  "StormPegasis 3-70RA · RockLeone 6-80GN · Lightning L-Drago (Upper) 1-60F",
  "SharkEdge 5-60LR · OptimusPrime 1-60U · CrocCrunch 3-60LF",
];

const ILLEGAL = [
  "PhoenixWing 1-60LR · WizardRod 1-60L · DranBuster 5-60LR — two 1-60 ratchets",
  "CobaltDrake 5-60LR · ScorpioSpear 9-60FB · CobaltDrake 3-60P — two CobaltDrake blades",
  "StormPegasis 3-70RA · Lightning L-Drago 3-60LR · Lightning L-Drago (Upper) 1-60F — same part twice",
];

export default function RulesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Rulebook"
        title="Rules & scoring"
        description="The official Beyblade X match procedure encoded straight into the app."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-[0.16em] text-white/70">
            Match types
          </h2>
          <p className="mb-4 text-sm text-white/45">
            Pick the format when you create a tournament.
          </p>
          <div className="space-y-3">
            {MATCH_TYPES.map((type) => (
              <div
                key={type.value}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{type.label}</h3>
                  {type.official ? (
                    <span className="badge bg-blaze-500/20 text-blaze-400">Official</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-white/50">{type.blurb}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-[0.16em] text-white/70">
            Battle results & points
          </h2>
          <p className="mb-4 text-sm text-white/45">
            Judging a match with one of these results auto-scores the points.
          </p>
          <div className="space-y-2.5">
            {FINISH_TYPES.map((finish) => (
              <div
                key={finish.value}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span className="text-sm font-semibold text-white/85">
                  {finish.label}
                </span>
                <span
                  className={`badge ${
                    finish.points >= 3
                      ? "bg-blaze-500/20 text-blaze-400"
                      : finish.points === 2
                        ? "bg-volt-400/15 text-volt-400"
                        : "bg-white/10 text-white/60"
                  }`}
                >
                  {finish.points} point{finish.points === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-black/30 p-3 text-xs leading-relaxed text-white/45">
            A blader cannot earn more points than the number required to win the set.
            Best-of-3 events need two 4-point sets; the loser of a set picks launch
            position for the next set and both bladers may re-order their decks in secret.
          </p>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-white/70">
            <Icon name="check" className="h-4 w-4 text-emerald-400" /> Once before the
            first battle
          </h2>
          <ol className="space-y-3">
            {PRE_MATCH.map((step) => (
              <li key={step.title} className="rounded-xl bg-white/[0.03] p-4">
                <h3 className="text-sm font-bold text-blaze-400">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/55">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-white/70">
            <Icon name="swords" className="h-4 w-4 text-volt-400" /> Repeat every battle
          </h2>
          <ol className="space-y-3">
            {EACH_BATTLE.map((step) => (
              <li key={step.title} className="rounded-xl bg-white/[0.03] p-4">
                <h3 className="text-sm font-bold text-volt-400">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/55">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="card border-emerald-500/20 p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-emerald-300">
            Legal deck examples
          </h2>
          <ul className="space-y-2">
            {LEGAL.map((line) => (
              <li
                key={line}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-100"
              >
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/45">
            Every part is different. Similar-looking blades (SharkEdge / OptimusPrime /
            CrocCrunch) still count as unique parts.
          </p>
        </div>

        <div className="card border-rose-500/20 p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-rose-300">
            Illegal deck examples
          </h2>
          <ul className="space-y-2">
            {ILLEGAL.map((line) => {
              const [combo, reason] = line.split(" — ");
              return (
                <li
                  key={line}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100"
                >
                  <span className="font-semibold">{combo}</span>
                  {reason ? (
                    <span className="block text-xs text-rose-200/80">{reason}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-white/45">
            The deck validator in this app blocks every one of these before a blader can
            be registered.
          </p>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-white/70">
          Launch range & interference
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Height",
              body: "At least part of your Bey must be within 5 cm (2 in) above the highest point of the stadium cover.",
            },
            {
              title: "Tilt limit",
              body: "Never tilt your Bey more than 70° in any direction before launch.",
            },
            {
              title: "Stay in your zone",
              body: "Keep feet, hands and launcher on your side of the boundary line for the whole launch.",
            },
            {
              title: "No touching",
              body: "First offence is a warning and a restart. Second offence awards your opponent 1 point.",
            },
          ].map((rule) => (
            <div key={rule.title} className="rounded-xl bg-white/[0.03] p-4">
              <h3 className="text-sm font-bold text-white">{rule.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/50">{rule.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
