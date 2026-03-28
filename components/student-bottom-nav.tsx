"use client";

import { BottomNav } from "@/components/bottom-nav";
import { navItems } from "@/lib/nav-items";
import { useStudentShell } from "@/components/student-shell-provider";

export function StudentBottomNav() {
  const { link } = useStudentShell();
  const locked = !link || link.status !== "linked";

  return (
    <BottomNav
      items={navItems}
      lockedItemHrefs={locked ? ["/", "/results", "/rankings"] : []}
      redirectHref="/profile"
    />
  );
}
