import { Suspense } from "react";
import {
  DashboardCacheClearButton,
  DashboardCacheRebuildButton,
  RankingRebuildButton
} from "@/components/admin-actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminSectionFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminMaintenanceInfo } from "@/lib/queries/admin";

export default async function AdminMaintenancePage() {
  await requireAdminSession();
  const infoPromise = getAdminMaintenanceInfo();

  return (
    <AdminShell eyebrow="Internal maintenance" title="Maintenance">
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)]">
        <Suspense
          fallback={
            <AdminSectionFallback
              title="Maintenance controls"
              description="Manage ranking and dashboard snapshot caches."
              rows={2}
            />
          }
        >
          <MaintenanceControls infoPromise={infoPromise} />
        </Suspense>

        <Suspense
          fallback={
            <AdminSectionFallback
              title="Recent maintenance activity"
              description="Cache rebuilds and clears are pulled from the admin audit log."
              rows={4}
            />
          }
        >
          <MaintenanceLogs infoPromise={infoPromise} />
        </Suspense>
      </section>
    </AdminShell>
  );
}

async function MaintenanceControls({
  infoPromise
}: {
  infoPromise: ReturnType<typeof getAdminMaintenanceInfo>;
}) {
  const info = await infoPromise;

  return (
    <div className="space-y-5 xl:sticky xl:top-8 xl:self-start">
      <SectionBlock
        title="Ranking cache"
        description="Rebuild the cached student_rankings table after admin data changes or batch updates."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge tone="accent">{info.totalRankingRows} rows stored</StatusBadge>
          <StatusBadge tone="warning">Destructive maintenance action</StatusBadge>
        </div>
        <RankingRebuildButton />
      </SectionBlock>

      <SectionBlock
        title="Dashboard cache"
        description="Manage stored full app snapshots for linked students, including rankings."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge tone="accent">{info.totalDashboardCacheRows} rows stored</StatusBadge>
          <StatusBadge tone="info">Only linked students are cached</StatusBadge>
        </div>
        <div className="flex flex-wrap gap-3">
          <DashboardCacheRebuildButton />
          <DashboardCacheClearButton />
        </div>
      </SectionBlock>
    </div>
  );
}

async function MaintenanceLogs({
  infoPromise
}: {
  infoPromise: ReturnType<typeof getAdminMaintenanceInfo>;
}) {
  const info = await infoPromise;

  return (
    <div className="space-y-5">
      <SectionBlock
        title="Recent ranking rebuilds"
        description="Pulled from the admin audit log."
      >
        <div className="space-y-3">
          {info.recentRankingRebuilds.length > 0 ? (
            info.recentRankingRebuilds.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[1.2rem] border border-line bg-surface px-4 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="accent">#{entry.id}</StatusBadge>
                  <StatusBadge tone="info">{entry.admin_email}</StatusBadge>
                </div>
                <div className="mt-2 text-sm font-semibold text-ink">{entry.created_at}</div>
                <div className="mt-1 text-sm text-slate">
                  {entry.after_json && "total_rows" in entry.after_json
                    ? `Rows after rebuild: ${String(entry.after_json.total_rows)}`
                    : "No row count stored."}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate">No ranking rebuild has been logged yet.</p>
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Recent dashboard cache actions"
        description="Full app snapshot rebuilds and clears are logged here."
      >
        <div className="space-y-3">
          {info.recentDashboardCacheActions.length > 0 ? (
            info.recentDashboardCacheActions.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[1.2rem] border border-line bg-surface px-4 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="accent">#{entry.id}</StatusBadge>
                  <StatusBadge tone="info">{entry.admin_email}</StatusBadge>
                  <StatusBadge tone={entry.action_key === "dashboard_cache.clear" ? "danger" : "warning"}>
                    {entry.action_key}
                  </StatusBadge>
                </div>
                <div className="mt-2 text-sm font-semibold text-ink">{entry.created_at}</div>
                <div className="mt-1 text-sm text-slate">
                  {entry.after_json && "total_rows" in entry.after_json
                    ? `Rows after action: ${String(entry.after_json.total_rows)}`
                    : "No row count stored."}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate">No dashboard cache action has been logged yet.</p>
          )}
        </div>
      </SectionBlock>
    </div>
  );
}
