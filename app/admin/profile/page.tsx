import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { isMainAdminUser, requireAdminSession } from "@/lib/auth/admin";

export default async function AdminProfilePage() {
  const admin = await requireAdminSession();
  const isMainAdmin = isMainAdminUser(admin);

  return (
    <>
      <SectionBlock title={admin.display_name ?? admin.email}>
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge tone="warning">
            {isMainAdmin
              ? "Main admin"
              : admin.staff_profile.staff_type === "placement_cell"
                ? "Placement cell"
                : admin.staff_profile.staff_type.toUpperCase()}
          </StatusBadge>
          {admin.staff_profile.branch_name ? <StatusBadge tone="accent">{admin.staff_profile.branch_name}</StatusBadge> : null}
          <StatusBadge tone={admin.email_verified ? "success" : "danger"}>
            {admin.email_verified ? "Email verified" : "Unverified"}
          </StatusBadge>
          <StatusBadge tone={admin.staff_profile.status === "active" ? "success" : "danger"}>
            {admin.staff_profile.status}
          </StatusBadge>
        </div>

        <div className="space-y-3 text-sm text-slate">
          <div className="rounded-[1rem] border border-line bg-surface px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">Name</div>
            <div className="mt-1 text-sm font-medium text-ink">{admin.display_name ?? "Admin"}</div>
          </div>
          <div className="rounded-[1rem] border border-line bg-surface px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">Email</div>
            <div className="mt-1 text-sm font-medium text-ink">{admin.email}</div>
          </div>
          <div className="rounded-[1rem] border border-line bg-surface px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">Role</div>
            <div className="mt-1 text-sm font-medium text-ink">
              {isMainAdmin
                ? "Main admin"
                : admin.staff_profile.staff_type === "placement_cell"
                  ? "Placement cell"
                  : admin.staff_profile.staff_type.toUpperCase()}
            </div>
          </div>
          <div className="rounded-[1rem] border border-line bg-surface px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">Branch scope</div>
            <div className="mt-1 text-sm font-medium text-ink">{admin.staff_profile.branch_name ?? "All branches"}</div>
          </div>
        </div>
      </SectionBlock>
    </>
  );
}
