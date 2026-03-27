import type { DashboardMetricTile } from "@/lib/dashboard-view";
import { cn } from "@/lib/utils";

export function MetricTile({ metric }: { metric: DashboardMetricTile }) {
  return (
    <div className="surface-2 relative min-h-40 overflow-hidden rounded-[1.6rem] border border-line p-4 shadow-[0_24px_60px_-38px_rgba(16,32,49,0.45)]">
      <div className="relative mb-8 flex items-start justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-mist">{metric.label}</div>
      </div>
      <div className="relative text-[2.55rem] font-bold tracking-[-0.09em] text-ink">{metric.value}</div>
      <p className="relative mt-3 max-w-xs text-sm leading-6 text-slate">{metric.hint}</p>
    </div>
  );
}
