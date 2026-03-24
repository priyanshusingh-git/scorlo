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
        "surface-panel relative overflow-hidden rounded-scorlo border border-line p-5 shadow-soft",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-ink">{title}</h2>
        {description ? <p className="text-sm leading-6 text-slate">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
