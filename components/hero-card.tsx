export function HeroCard({
  name,
}: {
  name: string;
  // Others kept for compatibility
  summary?: string;
  branch?: string | null;
  rollNo?: string;
  status?: string;
  primarySignalLabel?: string;
  primarySignal?: string;
  primarySignalHint?: string;
  totalSemesters?: number;
  institute?: string | null;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-elevated px-6 py-8 shadow-scorlo sm:px-8 sm:py-10">
      <div className="absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full bg-accent/5 blur-[100px]" />
      <div className="absolute -left-24 -bottom-24 h-[320px] w-[320px] rounded-full bg-accent/5 blur-[100px]" />
      
      <div className="relative z-10 flex flex-col gap-2">
        <div className="text-sm font-medium uppercase tracking-[0.14em] text-mist">
          Welcome
        </div>
        <h1 className="font-display text-[2.1rem] leading-[0.96] tracking-tight text-ink sm:text-[2.6rem]">
          <span className="block break-words text-accent">{name}</span>
        </h1>
      </div>
    </section>
  );
}
