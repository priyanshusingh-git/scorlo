import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminSectionFallback, AdminStatsFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { isMainAdminUser, requireAdminSession } from "@/lib/auth/admin";
import { getAdminOverview } from "@/lib/queries/admin";

export default async function AdminOverviewPage() {
  const admin = await requireAdminSession();
  const isMainAdmin = isMainAdminUser(admin);

  if (!isMainAdmin) {
    redirect("/admin/students");
  }

  const overviewPromise = getAdminOverview();

  return (
    <AdminShell eyebrow="Operations console" title="Admin Overview">
      <Suspense fallback={<AdminStatsFallback />}>
        <OverviewStats overviewPromise={overviewPromise} />
      </Suspense>

      <Suspense
        fallback={
          <AdminSectionFallback
            title="Recent login activity"
            description=""
            rows={5}
          />
        }
      >
        <RecentLoginsSection overviewPromise={overviewPromise} />
      </Suspense>

      <Suspense
        fallback={
          <AdminSectionFallback
            title="Recent admin actions"
            description=""
            rows={5}
          />
        }
      >
        <RecentAuditLogsSection overviewPromise={overviewPromise} />
      </Suspense>
    </AdminShell>
  );
}

async function OverviewStats({
  overviewPromise
}: {
  overviewPromise: ReturnType<typeof getAdminOverview>;
}) {
  const overview = await overviewPromise;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="App users" value={overview.counts.totalUsers} />
      <StatCard label="Admins" value={overview.counts.totalAdmins} />
      <StatCard label="Linked accounts" value={overview.counts.linkedAccounts} />
      <StatCard label="Pending requests" value={overview.counts.pendingRequests} />
      <StatCard label="Rejected links" value={overview.counts.rejectedLinks} />
      <StatCard label="Students" value={overview.counts.totalStudents} />
      <StatCard label="Ranking rows" value={overview.counts.totalRankingRows} />
    </section>
  );
}

async function RecentLoginsSection({
  overviewPromise
}: {
  overviewPromise: ReturnType<typeof getAdminOverview>;
}) {
  const overview = await overviewPromise;

  return (
    <SectionBlock
      title="Recent login activity"
    >
      <div className="space-y-3">
        {overview.recentLogins.map((user) => (
          <div
            key={user.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-line bg-surface px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold text-ink">{user.email}</div>
              <div className="text-xs text-slate">
                {user.display_name ?? "No display name"} • Last login {user.last_login_at ?? "unknown"}
              </div>
            </div>
            <StatusBadge tone={user.role === "admin" ? "warning" : "info"}>{user.role}</StatusBadge>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}

async function RecentAuditLogsSection({
  overviewPromise
}: {
  overviewPromise: ReturnType<typeof getAdminOverview>;
}) {
  const overview = await overviewPromise;

  return (
    <SectionBlock
      title="Recent admin actions"
    >
      <div className="space-y-3">
        {overview.recentAuditLogs.length > 0 ? (
          overview.recentAuditLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-line bg-surface px-4 py-3"
            >
              <div>
                <div className="text-sm font-semibold text-ink">{log.action_key}</div>
                <div className="text-xs text-slate">
                  {log.target_table} #{log.target_id} • {log.admin_email}
                </div>
              </div>
              <StatusBadge tone="accent">{log.created_at}</StatusBadge>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate">No admin actions have been recorded yet.</p>
        )}
      </div>
    </SectionBlock>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-panel relative overflow-hidden rounded-[1.6rem] border border-white/70 px-4 py-5 shadow-[0_22px_55px_-38px_rgba(16,32,49,0.42)]">
      <div className="absolute -right-6 top-0 h-20 w-20 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative text-[11px] uppercase tracking-[0.18em] text-mist">{label}</div>
      <div className="relative mt-3 text-[2.45rem] font-semibold tracking-[-0.08em] text-ink">{value}</div>
    </div>
  );
}
