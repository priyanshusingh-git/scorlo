"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex lg:flex-col lg:gap-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            prefetch
            className={cn(
              "group flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 text-sm font-medium transition",
              active
                ? "border-white/20 bg-white text-ink shadow-[0_18px_40px_-24px_rgba(0,0,0,0.65)]"
                : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/8 hover:text-white"
            )}
          >
            <Icon className={cn("h-4 w-4 transition", active ? "text-accent-strong" : "text-white/75 group-hover:text-white")} strokeWidth={2.1} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
