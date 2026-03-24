import type { DashboardProgressPoint } from "@/lib/dashboard-view";

export function ProgressChart({ points }: { points: DashboardProgressPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="soft-grid rounded-[1.5rem] border border-line bg-app/70 p-4">
        <p className="text-sm leading-7 text-slate">
          SGPA trend will appear here once semester results are available in the academic database.
        </p>
      </div>
    );
  }

  const progress = points;
  const max = Math.max(...progress.map((point) => point.value));
  const min = Math.min(...progress.map((point) => point.value));
  const chartStart = 28;
  const chartEnd = 300;
  const step = progress.length === 1 ? 0 : (chartEnd - chartStart) / (progress.length - 1);

  const coordinates = progress.map((point, index) => {
    const x = chartStart + index * step;
    const range = max - min || 1;
    const normalized = (point.value - min) / range;
    const y = 122 - normalized * 62;
    return { ...point, x, y };
  });

  const path = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

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
          <div className="text-lg font-bold tracking-[-0.04em] text-ink">{max.toFixed(2)}</div>
        </div>
      </div>
      <svg viewBox="0 0 340 150" className="h-44 w-full overflow-visible">
        <defs>
          <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(15,139,141,0.28)" />
            <stop offset="100%" stopColor="rgba(15,139,141,0.02)" />
          </linearGradient>
        </defs>
        <path d={`${path} L ${chartEnd} 132 L ${chartStart} 132 Z`} fill="url(#progressFill)" />
        <path
          d={`M${chartStart} 132 H${chartEnd}`}
          stroke="rgba(123, 135, 148, 0.25)"
          strokeWidth="1"
        />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
        {coordinates.map((point) => (
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
