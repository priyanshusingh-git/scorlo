import type { DashboardMetricTile } from "@/lib/dashboard-view";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

const toneMap = {
  accent: "accent" as const,
  success: "success" as const,
  warning: "warning" as const,
  danger: "danger" as const
};

export function MetricTile({ metric }: { metric: DashboardMetricTile }) {
  return (
    <div className="relative min-h-36 overflow-hidden rounded-[1.45rem] border border-line bg-surface p-4 shadow-soft">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1.5",
          metric.tone === "accent" && "bg-accent",
          metric.tone === "success" && "bg-success",
          metric.tone === "warning" && "bg-warning",
          metric.tone === "danger" && "bg-danger"
        )}
      />
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-mist">{metric.label}</div>
        <StatusBadge tone={toneMap[metric.tone]}>Live</StatusBadge>
      </div>
      <div className="text-[2.15rem] font-bold tracking-[-0.08em] text-ink">{metric.value}</div>
      <p className="mt-2 text-sm leading-6 text-slate">{metric.hint}</p>
    </div>
  );
}
