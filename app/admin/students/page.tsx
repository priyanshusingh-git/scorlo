import { AdminShell } from "@/components/admin-shell";
import { AdminStudentsTable } from "@/components/admin-students-table";
import { requireAdminSession } from "@/lib/auth/admin";

export default async function AdminStudentsPage() {
  await requireAdminSession();

  return (
    <AdminShell eyebrow="Academic records" title="Students">
      <AdminStudentsTable />
    </AdminShell>
  );
}
