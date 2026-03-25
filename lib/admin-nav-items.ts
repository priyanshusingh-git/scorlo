import { Gauge, Link2, Settings2, ShieldUser, UsersRound } from "lucide-react";

export const adminNavItems = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/links", label: "Links", icon: Link2 },
  { href: "/admin/students", label: "Students", icon: ShieldUser },
  { href: "/admin/maintenance", label: "Maintenance", icon: Settings2 }
];
