"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

export function MobileTopBar({
  label,
  className
}: {
  label: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-black/5 bg-[rgba(251,246,238,0.96)] px-4 py-3 shadow-[0_10px_24px_-22px_rgba(16,32,49,0.22)] lg:hidden sm:px-6",
        className
      )}
    >
      <div className="font-display text-[1.7rem] leading-none tracking-[-0.06em] text-ink flex items-center h-8">
        {label}
      </div>
      <LogoutButton className="inline-flex items-center gap-2 rounded-[1rem] border border-black/5 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-[0_10px_20px_-18px_rgba(16,32,49,0.2)] disabled:opacity-60" />
    </div>
  );
}
