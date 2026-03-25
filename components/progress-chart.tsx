import type { DashboardProgressChart } from "@/lib/queries/dashboard";

export function ProgressChart({ chart }: { chart: DashboardProgressChart }) {
  if (chart.points.length === 0) {
    return (
      <div className="soft-grid rounded-[1.5rem] border border-line bg-app/70 p-4">
        <p className="text-sm leading-7 text-slate">
          SGPA trend will appear here once semester results are available in the academic database.
        </p>
      </div>
    );
  }

  return (
    <div className="soft-grid rounded-[1.5rem] border border-line bg-app/70 p-4">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-mist">Progress arc</p>
          <p className="mt-1 text-base font-semibold tracking-[-0.03em] text-ink">
            SGPA trend across recorded semesters
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.14em] text-mist">Peak</div>
          <div className="text-lg font-bold tracking-[-0.04em] text-ink">{chart.peak_label}</div>
        </div>
      </div>
      <svg viewBox="0 0 340 150" className="h-44 w-full overflow-visible">
        <defs>
          <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(15,139,141,0.28)" />
            <stop offset="100%" stopColor="rgba(15,139,141,0.02)" />
          </linearGradient>
        </defs>
        <path d={chart.fill_path} fill="url(#progressFill)" />
        <path d="M28 132 H300" stroke="rgba(123, 135, 148, 0.25)" strokeWidth="1" />
        <path d={chart.path} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
        {chart.coordinates.map((point) => (
          <g key={point.semester}>
            <circle cx={point.x} cy={point.y} r="6" fill="var(--accent)" />
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
