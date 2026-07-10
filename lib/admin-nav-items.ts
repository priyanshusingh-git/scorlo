import { BarChart3, CircleHelp, Gauge, Settings2, ShieldUser, UserCog, UserRound, UsersRound } from "lucide-react";
import type { StaffType } from "@/lib/staff-access";

export const mainAdminNavItems = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/admins", label: "Staff", icon: UserCog },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/students", label: "Students", icon: ShieldUser },
  { href: "/admin/branches", label: "Branches", icon: BarChart3 },
  { href: "/admin/issues", label: "Issues", icon: CircleHelp },
  { href: "/admin/maintenance", label: "Maintenance", icon: Settings2 }
];

export const hodNavItems = [
  { href: "/admin/students", label: "Students", icon: ShieldUser },
  { href: "/admin/branches", label: "Branches", icon: BarChart3 },
  { href: "/admin/admins", label: "Teachers", icon: UserCog },
  { href: "/admin/profile", label: "Profile", icon: UserRound }
];

export const delegatedReadOnlyNavItems = [
  { href: "/admin/students", label: "Students", icon: ShieldUser },
  { href: "/admin/branches", label: "Branches", icon: BarChart3 },
  { href: "/admin/profile", label: "Profile", icon: UserRound }
];

export type AdminNavItem =
  | (typeof mainAdminNavItems)[number]
  | (typeof hodNavItems)[number]
  | (typeof delegatedReadOnlyNavItems)[number];

export function getAdminNavItems(staffType: StaffType) {
  if (staffType === "main_admin") {
    return mainAdminNavItems;
  }

  if (staffType === "hod") {
    return hodNavItems;
  }

  return delegatedReadOnlyNavItems;
}
