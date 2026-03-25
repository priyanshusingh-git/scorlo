import { cn } from "@/lib/utils";

export function SectionBlock({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "surface-panel relative overflow-hidden rounded-[1.9rem] border border-white/65 p-5 shadow-[0_28px_70px_-42px_rgba(16,32,49,0.42)] sm:p-6",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-warning/30" />
      <div className="absolute -right-16 top-0 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-warning/10 blur-3xl" />
      <div className="relative mb-5 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mist">Scorlo panel</div>
        <h2 className="text-[1.2rem] font-bold tracking-[-0.03em] text-ink sm:text-[1.35rem]">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-7 text-slate">{description}</p> : null}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
