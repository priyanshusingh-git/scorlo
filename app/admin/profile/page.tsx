import { AdminShell } from "@/components/admin-shell";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { isMainAdminUser, requireAdminSession } from "@/lib/auth/admin";

export default async function AdminProfilePage() {
  const admin = await requireAdminSession();
  const isMainAdmin = isMainAdminUser(admin);

  return (
    <AdminShell eyebrow="Admin profile" title="Profile">
      <SectionBlock title={admin.display_name ?? admin.email}>
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge tone="warning">{isMainAdmin ? "Main admin" : "Admin"}</StatusBadge>
          <StatusBadge tone={admin.email_verified ? "success" : "danger"}>
            {admin.email_verified ? "Email verified" : "Unverified"}
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
            <div className="mt-1 text-sm font-medium text-ink">{isMainAdmin ? "Main admin" : "Admin"}</div>
          </div>
        </div>
      </SectionBlock>
    </AdminShell>
  );
}
