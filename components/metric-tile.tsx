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
    <div className="surface-panel relative min-h-40 overflow-hidden rounded-[1.6rem] border border-white/75 p-4 shadow-[0_24px_60px_-38px_rgba(16,32,49,0.45)]">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1.5",
          metric.tone === "accent" && "bg-accent",
          metric.tone === "success" && "bg-success",
          metric.tone === "warning" && "bg-warning",
          metric.tone === "danger" && "bg-danger"
        )}
      />
      <div className="absolute -right-6 top-6 h-20 w-20 rounded-full bg-white/40 blur-2xl" />
      <div className="relative mb-8 flex items-start justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-mist">{metric.label}</div>
        <StatusBadge tone={toneMap[metric.tone]}>Live</StatusBadge>
      </div>
      <div className="relative text-[2.55rem] font-bold tracking-[-0.09em] text-ink">{metric.value}</div>
      <p className="relative mt-3 max-w-xs text-sm leading-6 text-slate">{metric.hint}</p>
    </div>
  );
}
