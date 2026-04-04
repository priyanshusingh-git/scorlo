"use client";

import { BottomNav } from "@/components/bottom-nav";
import { getAdminNavItems } from "@/lib/admin-nav-items";
import type { StaffType } from "@/lib/staff-access";

export function AdminBottomNav({ staffType }: { staffType: StaffType }) {
  const items = getAdminNavItems(staffType);

  return <BottomNav items={items} />;
}
