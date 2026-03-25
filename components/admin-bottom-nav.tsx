"use client";

import { BottomNav } from "@/components/bottom-nav";
import { adminNavItems } from "@/lib/admin-nav-items";

export function AdminBottomNav() {
  return <BottomNav items={adminNavItems} />;
}
