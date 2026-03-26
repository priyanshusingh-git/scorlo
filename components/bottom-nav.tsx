"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";

type NavItem = (typeof navItems)[number];

export function BottomNav({ items = navItems }: { items?: NavItem[] }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const isDense = items.length >= 6;

  useEffect(() => {
    let lastScrollY = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= 16) {
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
    <nav
      className={cn(
        "glass-card fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-1rem)] items-center rounded-[1.9rem] border border-white/70 shadow-[0_28px_70px_-36px_rgba(16,32,49,0.55)] transition-transform duration-300 ease-out lg:hidden",
        isDense ? "max-w-[28rem] justify-between px-2 py-2" : "max-w-md justify-between px-3 py-2",
        visible ? "translate-y-0" : "pointer-events-none translate-y-[calc(100%+1.5rem)]"
      )}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            prefetch
            className={cn(
              "flex flex-col items-center gap-1 rounded-[1.2rem] border text-[11px] font-medium transition-all duration-200 ease-out",
              isDense ? "min-w-0 flex-1 px-1.5 py-2 text-[10px]" : "min-w-16 px-3 py-2",
              active
                ? "-translate-y-0.5 border-accent/15 bg-accent-soft text-accent-strong shadow-[0_10px_25px_-18px_rgba(14,128,123,0.7)]"
                : "border-transparent text-mist hover:bg-white/30"
            )}
          >
            <Icon className="h-4 w-4 transition-transform duration-200" strokeWidth={2.2} />
            <span className={cn("truncate", isDense ? "max-w-full" : "")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
