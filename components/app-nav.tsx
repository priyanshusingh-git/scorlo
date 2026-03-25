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
              "flex items-center gap-3 rounded-[1.15rem] px-4 py-3 text-sm font-medium transition",
              active
                ? "bg-white text-ink shadow-soft"
                : "text-white/72 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.1} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
