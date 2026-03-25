import type { DashboardProgressChart } from "@/lib/queries/dashboard";

export function ProgressChart({ chart }: { chart: DashboardProgressChart }) {
  if (chart.points.length === 0) {
    return (
      <div className="soft-grid rounded-[1.7rem] border border-white/70 bg-app/60 p-5">
        <p className="text-sm leading-7 text-slate">
          Your SGPA trend will appear here once semester results are available.
        </p>
      </div>
    );
  }

  return (
    <div className="soft-grid relative overflow-hidden rounded-[1.7rem] border border-white/70 bg-app/60 p-5">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-mist">Progress arc</p>
          <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-ink">
            SGPA trend across recorded semesters
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.14em] text-mist">Peak</div>
          <div className="text-lg font-bold tracking-[-0.04em] text-ink">{chart.peak_label}</div>
        </div>
      </div>
      <svg viewBox="0 0 340 150" className="relative h-44 w-full overflow-visible">
        <defs>
          <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(14,128,123,0.3)" />
            <stop offset="100%" stopColor="rgba(14,128,123,0.03)" />
          </linearGradient>
        </defs>
        <path d={chart.fill_path} fill="url(#progressFill)" />
        <path d="M28 132 H300" stroke="rgba(123, 135, 148, 0.25)" strokeWidth="1" />
        <path d={chart.path} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
        {chart.coordinates.map((point) => (
          <g key={point.semester}>
            <circle cx={point.x} cy={point.y} r="7" fill="white" opacity="0.6" />
            <circle cx={point.x} cy={point.y} r="4.5" fill="var(--accent)" />
            <text
              x={point.x}
              y={144}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-muted)"
              fontFamily="var(--font-ui)"
            >
              {point.semester}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
