import { Suspense } from "react";
import {
  AdminCreateAdminForm,
  AdminDangerButton,
  AdminStaffProfileForm
} from "@/components/admin-actions";
import { AdminSectionFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { isMainAdminUser, requireAdminSession } from "@/lib/auth/admin";
import { getAvailableAdminBranches, searchAdminAccounts } from "@/lib/queries/admin";
import { isHodStaff } from "@/lib/staff-access";

export default async function AdminAccountsPage() {
  const admin = await requireAdminSession();
  const isMainAdmin = isMainAdminUser(admin);
  const isHod = isHodStaff(admin);

  if (!isMainAdmin && !isHod) {
    return (
      <SectionBlock title="Staff directory">
        <p className="text-sm text-slate">Your role has read-only access to student records only.</p>
      </SectionBlock>
    );
  }

  const actorType = admin.staff_profile.staff_type as "main_admin" | "hod";
  const adminsPromise = searchAdminAccounts({ query: "" });
  const branchesPromise = getAvailableAdminBranches();

  return (
    <>
      <Suspense fallback={<AdminSectionFallback title="Create staff" description="" rows={2} />}>
        <CreateStaffSection
          branchesPromise={branchesPromise}
          actorType={actorType}
          actorBranchName={admin.staff_profile.branch_name}
        />
      </Suspense>

      <Suspense
        fallback={
          <AdminSectionFallback
            title={isMainAdmin ? "Staff directory" : "Branch teachers"}
            description=""
            rows={3}
          />
        }
      >
        <AdminAccountsList
          adminsPromise={adminsPromise}
          branchesPromise={branchesPromise}
          currentAdminId={admin.id}
          actorType={actorType}
          actorBranchName={admin.staff_profile.branch_name}
        />
      </Suspense>
    </>
  );
}

async function CreateStaffSection({
  branchesPromise,
  actorType,
  actorBranchName
}: {
  branchesPromise: ReturnType<typeof getAvailableAdminBranches>;
  actorType: "main_admin" | "hod";
  actorBranchName: string | null;
}) {
  const branches = await branchesPromise;

  return (
    <SectionBlock title={actorType === "hod" ? "Create teacher" : "Create staff"}>
      <AdminCreateAdminForm
        actorType={actorType}
        actorBranchName={actorBranchName}
        availableBranches={branches}
      />
    </SectionBlock>
  );
}

async function AdminAccountsList({
  adminsPromise,
  branchesPromise,
  currentAdminId,
  actorType,
  actorBranchName
}: {
  adminsPromise: ReturnType<typeof searchAdminAccounts>;
  branchesPromise: ReturnType<typeof getAvailableAdminBranches>;
  currentAdminId: number;
  actorType: "main_admin" | "hod";
  actorBranchName: string | null;
}) {
  const [admins, branches] = await Promise.all([adminsPromise, branchesPromise]);
  const visibleAccounts =
    actorType === "main_admin"
      ? admins
      : admins.filter(
          (account) =>
            account.staff_type === "teacher" &&
            account.branch_name === actorBranchName
        );

  return (
    <div className="space-y-4">
      {visibleAccounts.map((account) => (
        <SectionBlock
          key={account.id}
          title={account.display_name ?? "Staff account"}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge tone={account.is_main_admin ? "warning" : "info"}>
              {account.is_main_admin
                ? "Main admin"
                : account.staff_type === "placement_cell"
                  ? "Placement cell"
                  : account.staff_type.toUpperCase()}
            </StatusBadge>
            {account.branch_name ? <StatusBadge tone="accent">{account.branch_name}</StatusBadge> : null}
            <StatusBadge tone={account.status === "active" ? "success" : "danger"}>
              {account.status}
            </StatusBadge>
            <StatusBadge tone={account.email_verified ? "success" : "danger"}>
              {account.email_verified ? "Email verified" : "Unverified"}
            </StatusBadge>
            {account.id === currentAdminId ? <StatusBadge tone="info">Current session</StatusBadge> : null}
          </div>
          <div className="space-y-4">
            <div className="text-sm text-slate">{account.email}</div>

            {actorType === "main_admin" && !account.is_main_admin ? (
              <AdminStaffProfileForm
                userId={account.id}
                initialStaffType={account.staff_type === "main_admin" ? "placement_cell" : account.staff_type}
                initialBranchName={account.branch_name}
                initialStatus={account.status === "suspended" ? "suspended" : "active"}
                availableBranches={branches}
              />
            ) : null}

            {actorType === "main_admin" && !account.is_main_admin ? (
              <AdminDangerButton
                label="Delete staff account"
                url={`/api/admin/users/${account.id}`}
                confirmMessage={`Delete staff account ${account.display_name ?? account.email}?`}
                successMessage="Staff account deleted."
              />
            ) : null}
          </div>
        </SectionBlock>
      ))}

      {visibleAccounts.length === 0 ? (
        <SectionBlock title="No staff accounts found">
          <p className="text-sm text-slate">
            {actorType === "hod"
              ? "No teacher accounts are assigned to your branch yet."
              : "No staff accounts matched the search."}
          </p>
        </SectionBlock>
      ) : null}
    </div>
  );
}
