"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

export function MobileTopBar({
  label,
  className
}: {
  label: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= 12) {
        setVisible(true);
      } else if (delta > 8) {
        setVisible(false);
      } else if (delta < -8) {
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "shell-panel fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/70 px-4 py-3 shadow-[0_20px_45px_-38px_rgba(16,32,49,0.45)] transition-transform duration-300 ease-out lg:hidden sm:px-6",
        visible ? "translate-y-0" : "-translate-y-[calc(100%+1.5rem)]",
        className
      )}
    >
      <div className="font-display text-[1.7rem] leading-none tracking-[-0.06em] text-ink">{label}</div>
      <LogoutButton className="glass-card inline-flex items-center gap-2 rounded-[1rem] border border-white/70 px-3 py-2 text-sm font-semibold text-ink shadow-soft disabled:opacity-60" />
    </div>
  );
}
