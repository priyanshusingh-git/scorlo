"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";

type NavItem = (typeof navItems)[number];

export function BottomNav({ items = navItems }: { items?: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="glass-card fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-1.5rem)] max-w-md items-center justify-between rounded-[1.9rem] border border-white/70 px-3 py-2 shadow-[0_28px_70px_-36px_rgba(16,32,49,0.55)] lg:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            prefetch
            className={cn(
              "flex min-w-16 flex-col items-center gap-1 rounded-[1.2rem] border px-3 py-2 text-[11px] font-medium transition",
              active
                ? "border-accent/15 bg-accent-soft text-accent-strong shadow-[0_10px_25px_-18px_rgba(14,128,123,0.7)]"
                : "border-transparent text-mist"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
