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
        "surface-1 relative overflow-hidden rounded-[1.9rem] border border-line p-5 shadow-[0_28px_70px_-42px_rgba(16,32,49,0.42)] sm:p-6",
        className
      )}
    >
      <div className="relative mb-4 space-y-1">
        <h2 className="text-[1.2rem] font-bold tracking-[-0.03em] text-ink sm:text-[1.35rem]">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-7 text-slate">{description}</p> : null}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
