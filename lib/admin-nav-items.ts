import { Gauge, Settings2, ShieldUser, UsersRound, UserCog } from "lucide-react";

export const adminNavItems = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/admins", label: "Admins", icon: UserCog },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/students", label: "Students", icon: ShieldUser },
  { href: "/admin/maintenance", label: "Maintenance", icon: Settings2 }
];

export type AdminNavItem = (typeof adminNavItems)[number];

export function getAdminNavItems(isMainAdmin: boolean) {
  return adminNavItems.filter((item) => {
    if (!isMainAdmin && (item.href === "/admin/admins" || item.href === "/admin/maintenance")) {
      return false;
    }

    return true;
  });
}
