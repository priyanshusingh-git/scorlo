import { StatusBadge } from "@/components/status-badge";

export function HeroCard({
  name,
  summary,
  branch,
  rollNo,
  status,
  primarySignalLabel,
  primarySignal,
  primarySignalHint,
  totalSemesters,
  institute
}: {
  name: string;
  summary: string;
  branch: string | null;
  rollNo: string;
  status: string;
  primarySignalLabel: string;
  primarySignal: string;
  primarySignalHint: string;
  totalSemesters: number;
  institute: string | null;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.9rem] border border-line-strong bg-elevated p-5 shadow-scorlo sm:p-6 xl:p-7">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-accent-soft/70 via-transparent to-warning-soft/60" />
      <div className="absolute -right-10 top-8 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_290px] xl:items-end">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="font-display text-[2rem] leading-none tracking-[-0.04em] text-ink sm:text-[2.35rem]">
                {name}
              </p>
              <p className="max-w-2xl text-sm leading-6 text-slate sm:text-[15px] sm:leading-7">
                {summary}
              </p>
            </div>
            {branch ? <StatusBadge tone="accent">{branch}</StatusBadge> : null}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate sm:grid-cols-3 xl:mt-6">
            <div className="rounded-[1.125rem] bg-app/80 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-mist">Institute</div>
              <div className="mt-1 line-clamp-2 font-semibold text-ink">{institute ?? "Not synced yet"}</div>
            </div>
            <div className="rounded-[1.125rem] bg-app/80 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-mist">Roll no.</div>
              <div className="mt-1 font-semibold text-ink">{rollNo}</div>
            </div>
            <div className="col-span-2 rounded-[1.125rem] bg-app/80 px-4 py-3 sm:col-span-1">
              <div className="text-[11px] uppercase tracking-[0.14em] text-mist">Status</div>
              <div className="mt-1 font-semibold text-ink">{status}</div>
            </div>
          </div>
        </div>
        <div className="soft-grid rounded-[1.5rem] border border-line bg-surface/80 p-4 backdrop-blur">
          <div className="text-[11px] uppercase tracking-[0.18em] text-mist">{primarySignalLabel}</div>
          <div className="mt-3 text-[2.6rem] font-bold leading-none tracking-[-0.08em] text-ink">
            {primarySignal}
          </div>
          <div className="mt-1 text-sm leading-6 text-slate">{primarySignalHint}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge tone={status === "No active backs" ? "success" : "warning"}>{status}</StatusBadge>
            <StatusBadge tone="info">{totalSemesters} semester{totalSemesters === 1 ? "" : "s"} tracked</StatusBadge>
          </div>
        </div>
      </div>
    </section>
  );
}
