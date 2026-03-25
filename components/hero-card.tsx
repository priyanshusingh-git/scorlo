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
    <section className="ink-panel relative overflow-hidden rounded-[2rem] border border-white/8 p-5 text-white shadow-[0_35px_90px_-46px_rgba(6,16,26,0.9)] sm:p-6 xl:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.14),transparent_20%),radial-gradient(circle_at_82%_18%,rgba(181,117,41,0.18),transparent_18%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_52%)]" />
      <div className="absolute -right-12 top-8 h-40 w-40 rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-warning/18 blur-3xl" />
      <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_320px] xl:items-end">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/48">Linked academic identity</div>
              <p className="font-display text-[2.2rem] leading-none tracking-[-0.05em] text-white sm:text-[2.75rem]">
                {name}
              </p>
              <p className="max-w-2xl text-sm leading-7 text-white/70 sm:text-[15px]">
                {summary}
              </p>
            </div>
            {branch ? <StatusBadge tone="accent" className="border-white/10 bg-white/10 text-white">{branch}</StatusBadge> : null}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-white/72 sm:grid-cols-3 xl:mt-7">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Institute</div>
              <div className="mt-2 line-clamp-2 font-semibold text-white">{institute ?? "Not synced yet"}</div>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Roll no.</div>
              <div className="mt-2 font-semibold text-white">{rollNo}</div>
            </div>
            <div className="col-span-2 rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur sm:col-span-1">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Status</div>
              <div className="mt-2 font-semibold text-white">{status}</div>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/9 p-5 backdrop-blur">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="relative text-[11px] uppercase tracking-[0.18em] text-white/44">{primarySignalLabel}</div>
          <div className="relative mt-4 text-[3rem] font-bold leading-none tracking-[-0.09em] text-white">
            {primarySignal}
          </div>
          <div className="mt-2 text-sm leading-6 text-white/64">{primarySignalHint}</div>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge tone={status === "No active backs" ? "success" : "warning"} className="border-white/10 bg-white/10 text-white">{status}</StatusBadge>
            <StatusBadge tone="info" className="border-white/10 bg-white/10 text-white">{totalSemesters} semester{totalSemesters === 1 ? "" : "s"} tracked</StatusBadge>
          </div>
        </div>
      </div>
    </section>
  );
}
