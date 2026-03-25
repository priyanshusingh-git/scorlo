import { cn } from "@/lib/utils";

const tones = {
  accent: "border border-accent/15 bg-accent-soft/90 text-accent-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
  success: "border border-success/15 bg-success-soft/90 text-success shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
  warning: "border border-warning/15 bg-warning-soft/90 text-warning shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
  danger: "border border-danger/15 bg-danger-soft/90 text-danger shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
  info: "border border-info/15 bg-info-soft/90 text-info shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
} as const;

export function StatusBadge({
  children,
  tone = "accent",
  className
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase backdrop-blur",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
