"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-1.5rem)] max-w-md items-center justify-between rounded-[1.75rem] border border-line bg-surface/90 px-3 py-2 shadow-scorlo backdrop-blur lg:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition",
              active ? "bg-accent-soft text-accent-strong" : "text-mist"
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
