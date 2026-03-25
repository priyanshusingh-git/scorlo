import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { AdminSectionFallback, AdminStatsFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminOverview } from "@/lib/queries/admin";

export default async function AdminOverviewPage() {
  await requireAdminSession();
  const overviewPromise = getAdminOverview();

  return (
    <AdminShell eyebrow="Operations console" title="Admin Overview">
      <Suspense fallback={<AdminStatsFallback />}>
        <OverviewStats overviewPromise={overviewPromise} />
      </Suspense>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
        <QuickActionsSection />
        <Suspense
          fallback={
            <AdminSectionFallback
              title="Recent login activity"
              description="The most recent successful app sessions from Firebase-authenticated users."
              rows={4}
            />
          }
        >
          <RecentLoginsSection overviewPromise={overviewPromise} />
        </Suspense>
      </section>

      <Suspense
        fallback={
          <AdminSectionFallback
            title="Recent admin actions"
            description="Every admin mutation is written to the audit log."
            rows={4}
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

function QuickActionsSection() {
  return (
    <SectionBlock
      title="Quick actions"
      description="Jump directly into the admin areas that change account, link, and academic state."
    >
      <div className="space-y-3">
        <QuickLink href="/admin/admins" label="Manage admins" description="View admin-only accounts. Admin profiles are separate from student users." />
        <QuickLink href="/admin/users" label="Manage users" description="Inspect student accounts, linked state, and delete student-side app accounts." />
        <QuickLink href="/admin/links" label="Moderate links" description="Approve, reject, edit, or remove student link and data request records." />
        <QuickLink href="/admin/students" label="Explore students" description="Inspect live academic records and reassign links manually." />
        <QuickLink href="/admin/maintenance" label="Maintenance" description="Rebuild the ranking cache and inspect recent internal actions." />
      </div>
    </SectionBlock>
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
      description="The most recent successful app sessions from Firebase-authenticated users."
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
      description="Every admin mutation is written to the audit log."
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
    <div className="rounded-[1.35rem] border border-line bg-surface px-4 py-4 shadow-soft">
      <div className="text-[11px] uppercase tracking-[0.16em] text-mist">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  description
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="block rounded-[1.2rem] border border-line bg-surface px-4 py-4 transition hover:border-accent/40 hover:bg-app/70"
    >
      <div className="text-sm font-semibold text-ink">{label}</div>
      <div className="mt-1 text-sm leading-6 text-slate">{description}</div>
    </Link>
  );
}
