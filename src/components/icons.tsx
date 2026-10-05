import type { ReactNode, SVGProps } from "react";

const PATHS: Record<string, string[]> = {
  dashboard: ["M3 3h7v7H3z", "M14 3h7v5h-7z", "M14 12h7v9h-7z", "M3 14h7v7H3z"],
  trophy: [
    "M8 21h8",
    "M12 17v4",
    "M7 4h10v4a5 5 0 0 1-10 0z",
    "M7 6H4v1a3 3 0 0 0 3 3",
    "M17 6h3v1a3 3 0 0 1-3 3",
  ],
  users: [
    "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    "M22 20v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  swords: [
    "M14.5 17.5 3 6V3h3l11.5 11.5",
    "M13 19l6-6",
    "M16 16l4 4",
    "M19 21l2-2",
    "M14.5 6.5 18 3h3v3l-3.5 3.5",
  ],
  disc: [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  ],
  book: [
    "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
    "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
  ],
  settings: [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
    "M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-1.6-1H2a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 3.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8 4.6h.09A1.7 1.7 0 0 0 9 3V2a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8v.09a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z",
  ],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  plus: ["M12 5v14", "M5 12h14"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16", "M21 21l-4.35-4.35"],
  edit: [
    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
    "M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
  ],
  trash: [
    "M3 6h18",
    "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
    "M10 11v6",
    "M14 11v6",
    "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  ],
  x: ["M18 6 6 18", "M6 6l12 12"],
  check: ["M20 6 9 17l-5-5"],
  chevron: ["M6 9l6 6 6-6"],
  menu: ["M3 12h18", "M3 6h18", "M3 18h18"],
  flame: [
    "M12 22c4 0 6-2.7 6-6 0-4-3-5.5-3-9 0 0-3 1.5-3 5 0 0-2-1-2-4-2 2-4 4.5-4 8 0 3.3 2 6 6 6z",
  ],
  calendar: [
    "M8 2v4",
    "M16 2v4",
    "M3 10h18",
    "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  ],
  sparkles: [
    "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z",
    "M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
  ],
  bolt: ["M13 2 3 14h7l-1 8 10-12h-7z"],
  target: [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18",
    "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10",
    "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  ],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  chart: ["M3 3v18h18", "M7 15l4-6 3 3 5-8"],
};

export function Icon({
  name,
  className = "h-4 w-4",
  ...rest
}: { name: keyof typeof PATHS | string; className?: string } & SVGProps<SVGSVGElement>) {
  const paths = PATHS[name] ?? PATHS.dashboard;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function BeyGlyph({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="beyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8a5c" />
          <stop offset="55%" stopColor="#f5412a" />
          <stop offset="100%" stopColor="#12c2e9" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#beyGrad)" opacity="0.9" />
      <circle cx="50" cy="50" r="34" fill="#05070d" opacity="0.75" />
      <circle cx="50" cy="50" r="13" fill="url(#beyGrad)" />
      <path
        d="M50 6 L62 24 L82 20 L74 40 L92 50 L74 60 L82 80 L62 76 L50 94 L38 76 L18 80 L26 60 L8 50 L26 40 L18 20 L38 24 Z"
        fill="none"
        stroke="#05070d"
        strokeWidth="3"
        opacity="0.5"
      />
    </svg>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyState({
  icon = "disc",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-white/40 ring-1 ring-white/10">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <div>
        <p className="text-base font-semibold text-white">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
