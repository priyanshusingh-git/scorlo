"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { useMobileChromeVisibility } from "@/components/use-mobile-chrome-visibility";

export function MobileTopBar({
  label,
  className
}: {
  label: ReactNode;
  className?: string;
}) {
  const visible = useMobileChromeVisibility();

  return (
    <div
      className={cn(
        "shell-panel fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/70 px-4 py-3 shadow-[0_14px_32px_-28px_rgba(16,32,49,0.32)] transition-transform duration-300 ease-out supports-[backdrop-filter]:backdrop-blur-xl lg:hidden sm:px-6",
        visible ? "translate-y-0" : "-translate-y-[calc(100%+1.5rem)]",
        className
      )}
    >
      <div className="font-display text-[1.7rem] leading-none tracking-[-0.06em] text-ink flex items-center h-8">
        {label}
      </div>
      <LogoutButton className="inline-flex items-center gap-2 rounded-[1rem] border border-white/65 bg-white/55 px-3 py-2 text-sm font-semibold text-ink shadow-[0_12px_24px_-20px_rgba(16,32,49,0.3)] supports-[backdrop-filter]:backdrop-blur-md disabled:opacity-60" />
    </div>
  );
}
