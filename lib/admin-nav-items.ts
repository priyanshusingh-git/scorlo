import { Gauge, Settings2, ShieldUser, UserCog, UserRound, UsersRound } from "lucide-react";

export const mainAdminNavItems = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/admins", label: "Admins", icon: UserCog },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/students", label: "Students", icon: ShieldUser },
  { href: "/admin/maintenance", label: "Maintenance", icon: Settings2 }
];

export const delegatedAdminNavItems = [
  { href: "/admin/students", label: "Students", icon: ShieldUser },
  { href: "/admin/profile", label: "Profile", icon: UserRound }
];

export type AdminNavItem = (typeof mainAdminNavItems)[number] | (typeof delegatedAdminNavItems)[number];

export function getAdminNavItems(isMainAdmin: boolean) {
  return isMainAdmin ? mainAdminNavItems : delegatedAdminNavItems;
}
