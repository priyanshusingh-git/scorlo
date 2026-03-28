import { Suspense } from "react";
import {
  DashboardCacheClearButton,
  DashboardCacheRebuildButton,
  RankingRebuildButton,
  AuthCleanupButton
} from "@/components/admin-actions";
import { AdminSectionFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { requireMainAdminSession } from "@/lib/auth/admin";
import { getAdminMaintenanceInfo } from "@/lib/queries/admin";

export default async function AdminMaintenancePage() {
  await requireMainAdminSession();
  const infoPromise = getAdminMaintenanceInfo();

  return (
    <>
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)]">
        <Suspense
          fallback={
            <AdminSectionFallback
              title="Maintenance controls"
              description=""
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
              description=""
              rows={4}
            />
          }
        >
          <MaintenanceLogs infoPromise={infoPromise} />
        </Suspense>
      </section>
    </>
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
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge tone="accent">{info.totalRankingRows} rows stored</StatusBadge>
          <StatusBadge tone="warning">Destructive maintenance action</StatusBadge>
        </div>
        <RankingRebuildButton />
      </SectionBlock>

      <SectionBlock
        title="Dashboard cache"
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

      <SectionBlock
        title="Authentication"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge tone="warning">Destructive maintenance action</StatusBadge>
          <StatusBadge tone="info">Deletes unverified users (48h+)</StatusBadge>
        </div>
        <AuthCleanupButton />
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
