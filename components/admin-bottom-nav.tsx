"use client";

import { BottomNav } from "@/components/bottom-nav";
import { getAdminNavItems } from "@/lib/admin-nav-items";

export function AdminBottomNav({ isMainAdmin }: { isMainAdmin: boolean }) {
  const items = getAdminNavItems(isMainAdmin);

  return <BottomNav items={items} />;
}
