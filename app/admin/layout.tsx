import { AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/auth/admin";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();

  return <AdminShell>{children}</AdminShell>;
}
