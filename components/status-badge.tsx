import { cn } from "@/lib/utils";

const tones = {
  accent: "bg-accent-soft text-accent-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info"
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
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
