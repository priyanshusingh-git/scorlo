import { AdminStudentsTable } from "@/components/admin-students-table";
import { requireAdminSession } from "@/lib/auth/admin";

export default async function AdminStudentsPage() {
  await requireAdminSession();

  return <AdminStudentsTable />;
}
