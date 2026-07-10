import { AdminStudentsTable } from "@/components/admin-students-table";
import { requireAdminSession } from "@/lib/auth/admin";
import { getBranchScopedAccess } from "@/lib/staff-access";

export default async function AdminStudentsPage() {
  const admin = await requireAdminSession();
  const scopedBranch = getBranchScopedAccess(admin);

  return <AdminStudentsTable isScoped={scopedBranch !== null} />;
}
