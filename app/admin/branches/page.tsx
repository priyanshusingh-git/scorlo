import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { requireAdminSession } from "@/lib/auth/admin";
import { formatBranchLabel } from "@/lib/branch-label";
import {
  type BranchAnalyticsBatchLeaderboardRow,
  type BranchAnalyticsLeaderboardRow,
  getBranchAnalytics
} from "@/lib/queries/branch-analytics";
import { getBranchScopedAccess } from "@/lib/staff-access";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type BatchSummary = {
  total_batches: number;
  top_cgpa_batch: BranchAnalyticsBatchLeaderboardRow | null;
  top_percentage_batch: BranchAnalyticsBatchLeaderboardRow | null;
  top_no_back_batch: BranchAnalyticsBatchLeaderboardRow | null;
  average_students_per_batch: string;
};

function getSingleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function formatMetricValue(value: string | null, suffix = "") {
  return value ? `${value}${suffix}` : "--";
}

function formatRankValue(rank: number | null) {
  return rank ? `#${rank}` : "--";
}

function formatBatchLabel(passingYear: number) {
  return `Batch ${passingYear}`;
}

function buildBatchSummary(rows: BranchAnalyticsBatchLeaderboardRow[]): BatchSummary {
  const totalStudents = rows.reduce((sum, row) => sum + row.total_students, 0);

  return {
    total_batches: rows.length,
    top_cgpa_batch: rows.find((row) => row.cgpa_rank === 1) ?? null,
    top_percentage_batch: rows.find((row) => row.percentage_rank === 1) ?? null,
    top_no_back_batch: rows.find((row) => row.no_back_rate_rank === 1) ?? null,
    average_students_per_batch:
      rows.length > 0 ? (totalStudents / rows.length).toFixed(1) : "--"
  };
}

export default async function AdminBranchAnalyticsPage({ searchParams }: PageProps) {
  const admin = await requireAdminSession();
  const params = await searchParams;
  const scopedBranch = getBranchScopedAccess(admin);
  const analytics = await getBranchAnalytics({
    staffType: admin.staff_profile.staff_type,
    scopedBranch,
    institute: getSingleParam(params.institute),
    course: getSingleParam(params.course),
    batch: getSingleParam(params.batch),
    branch: getSingleParam(params.branch)
  });

  const selectedOverview = analytics.selected_branch_overview;
  const isBranchScoped = analytics.peer_leaderboard_hidden;
  const batchSummary = buildBatchSummary(analytics.batch_leaderboard);

  return (
    <div className="space-y-5 lg:space-y-6">
      <SectionBlock
        title="Branch analytics"
        description="Compare branch performance across average CGPA, average percentage, and no-back rate, then drill into batch-wise outcomes for the selected branch."
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={isBranchScoped ? "warning" : "accent"}>
            {isBranchScoped ? "Branch-scoped view" : "Cross-branch comparison"}
          </StatusBadge>
          {analytics.filters.selected_institute ? (
            <StatusBadge tone="info">{analytics.filters.selected_institute}</StatusBadge>
          ) : null}
          {analytics.filters.selected_course ? (
            <StatusBadge tone="info">{analytics.filters.selected_course}</StatusBadge>
          ) : null}
          {analytics.filters.selected_batch ? (
            <StatusBadge tone="success">{formatBatchLabel(analytics.filters.selected_batch)}</StatusBadge>
          ) : (
            <StatusBadge tone="success">All batches</StatusBadge>
          )}
          {selectedOverview ? (
            <StatusBadge tone="accent">{formatBranchLabel(selectedOverview.branch_name)}</StatusBadge>
          ) : null}
        </div>

        <form className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-4" method="GET">
          {isBranchScoped ? (
            <>
              <input type="hidden" name="institute" value={analytics.filters.selected_institute ?? ""} />
              <input type="hidden" name="course" value={analytics.filters.selected_course ?? ""} />
              <input type="hidden" name="branch" value={analytics.filters.selected_branch ?? ""} />
              <FilterField
                label="Institute"
                disabled
                value={analytics.filters.selected_institute ?? "Not available"}
              />
              <FilterField
                label="Course"
                disabled
                value={analytics.filters.selected_course ?? "Not available"}
              />
              <FilterField
                label="Branch"
                disabled
                value={analytics.filters.selected_branch ? formatBranchLabel(analytics.filters.selected_branch) : "Not assigned"}
              />
            </>
          ) : (
            <>
              <FilterSelect
                label="Institute"
                name="institute"
                options={analytics.filters.options.institutes.map((value) => ({
                  label: value,
                  value
                }))}
                defaultValue={analytics.filters.selected_institute ?? ""}
              />
              <FilterSelect
                label="Course"
                name="course"
                options={analytics.filters.options.courses.map((value) => ({
                  label: value,
                  value
                }))}
                defaultValue={analytics.filters.selected_course ?? ""}
              />
              <FilterSelect
                label="Branch"
                name="branch"
                options={analytics.filters.options.branches.map((value) => ({
                  label: formatBranchLabel(value),
                  value
                }))}
                defaultValue={analytics.filters.selected_branch ?? ""}
              />
            </>
          )}

          <FilterSelect
            label="Batch"
            name="batch"
            allowEmptyOption
            emptyOptionLabel="All batches"
            options={analytics.filters.options.batches.map((value) => ({
              label: formatBatchLabel(value),
              value: String(value)
            }))}
            defaultValue={analytics.filters.selected_batch ? String(analytics.filters.selected_batch) : ""}
          />

          <div className="lg:col-span-4 flex justify-end">
            <button className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">Apply filters</button>
          </div>
        </form>
      </SectionBlock>

      {analytics.empty_state ? (
        <SectionBlock title="No analytics data">
          <p className="text-sm leading-7 text-slate">{analytics.empty_state}</p>
        </SectionBlock>
      ) : null}

      {!analytics.empty_state && !isBranchScoped ? (
        <SectionBlock
          title="Branch leaderboard"
          description="Each branch is ranked independently across the three branch-level metrics."
        >
          <div className="space-y-3">
            {analytics.leaderboard.map((row) => (
              <BranchLeaderboardCard
                key={row.branch_name}
                row={row}
                selected={row.branch_name === analytics.filters.selected_branch}
              />
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {selectedOverview ? (
        <>
          <SectionBlock
            title={isBranchScoped ? "Your branch snapshot" : "Selected branch overview"}
            description="The selected branch summary and its peer-ranking positions for the current comparison set."
          >
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                <MetricTile label="Total students" value={String(selectedOverview.total_students)} />
                <MetricTile label="Average CGPA" value={formatMetricValue(selectedOverview.average_cgpa)} />
                <MetricTile label="Average %" value={formatMetricValue(selectedOverview.average_percentage, "%")} />
                <MetricTile label="No backs" value={String(selectedOverview.students_without_backs)} />
                <MetricTile label="With backs" value={String(selectedOverview.students_with_backs)} />
                <MetricTile label="No-back rate" value={formatMetricValue(selectedOverview.no_back_rate, "%")} />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-1">
                <RankTile
                  label="Avg CGPA rank"
                  rank={selectedOverview.cgpa_rank}
                  value={formatMetricValue(selectedOverview.average_cgpa)}
                />
                <RankTile
                  label="Avg % rank"
                  rank={selectedOverview.percentage_rank}
                  value={formatMetricValue(selectedOverview.average_percentage, "%")}
                />
                <RankTile
                  label="No-back rate rank"
                  rank={selectedOverview.no_back_rate_rank}
                  value={formatMetricValue(selectedOverview.no_back_rate, "%")}
                />
              </div>
            </div>
          </SectionBlock>

          <SectionBlock
            title="Batch leaderboard"
            description="Batches inside the selected branch ranked with the same academic metrics."
          >
            <div className="space-y-3">
              {analytics.batch_leaderboard.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-4">
                  <MetricTile label="Tracked batches" value={String(batchSummary.total_batches)} />
                  <MetricTile
                    label="Top CGPA batch"
                    value={
                      batchSummary.top_cgpa_batch
                        ? `${formatBatchLabel(batchSummary.top_cgpa_batch.passing_year)} • ${formatMetricValue(batchSummary.top_cgpa_batch.average_cgpa)}`
                        : "--"
                    }
                  />
                  <MetricTile
                    label="Top % batch"
                    value={
                      batchSummary.top_percentage_batch
                        ? `${formatBatchLabel(batchSummary.top_percentage_batch.passing_year)} • ${formatMetricValue(batchSummary.top_percentage_batch.average_percentage, "%")}`
                        : "--"
                    }
                  />
                  <MetricTile
                    label="Top no-back batch"
                    value={
                      batchSummary.top_no_back_batch
                        ? `${formatBatchLabel(batchSummary.top_no_back_batch.passing_year)} • ${formatMetricValue(batchSummary.top_no_back_batch.no_back_rate, "%")}`
                        : "--"
                    }
                  />
                  <MetricTile label="Avg students/batch" value={batchSummary.average_students_per_batch} />
                </div>
              ) : null}

              {analytics.batch_leaderboard.length > 0 ? (
                analytics.batch_leaderboard.map((row) => (
                  <BatchLeaderboardCard key={row.passing_year} row={row} />
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-line bg-surface px-4 py-6 text-sm text-slate">
                  No batch-level analytics are available for this branch yet.
                </div>
              )}
            </div>
          </SectionBlock>
        </>
      ) : null}
    </div>
  );
}

function FilterField({
  label,
  value,
  disabled = false
}: {
  label: string;
  value: string;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-mist">{label}</span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        readOnly
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink disabled:opacity-80"
      />
    </label>
  );
}

function FilterSelect({
  label,
  name,
  options,
  defaultValue,
  allowEmptyOption = false,
  emptyOptionLabel = "Select"
}: {
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  defaultValue: string;
  allowEmptyOption?: boolean;
  emptyOptionLabel?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-mist">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
      >
        {allowEmptyOption ? <option value="">{emptyOptionLabel}</option> : null}
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-line bg-surface px-4 py-4">
      <div className="text-[10px] uppercase tracking-[0.12em] text-mist sm:text-[11px] sm:tracking-[0.16em]">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}

function RankTile({
  label,
  rank,
  value
}: {
  label: string;
  rank: number | null;
  value: string;
}) {
  return (
    <div className="surface-2 rounded-[1.2rem] border border-line px-4 py-4 shadow-soft">
      <div className="text-[11px] uppercase tracking-[0.15em] text-mist">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="text-[2rem] font-semibold tracking-[-0.08em] text-ink">{formatRankValue(rank)}</div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.15em] text-mist">Metric</div>
          <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
        </div>
      </div>
    </div>
  );
}

function BranchLeaderboardCard({
  row,
  selected
}: {
  row: BranchAnalyticsLeaderboardRow;
  selected: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[1.35rem] border px-4 py-4 shadow-soft transition",
        selected ? "border-accent/30 bg-accent-soft/35" : "border-line bg-surface"
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-ink">{formatBranchLabel(row.branch_name)}</div>
          <div className="mt-1 text-sm text-slate">{row.total_students} students</div>
        </div>
        {selected ? <StatusBadge tone="accent">Selected branch</StatusBadge> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <MetricTile label="CGPA rank" value={formatRankValue(row.cgpa_rank)} />
        <MetricTile label="Percentage rank" value={formatRankValue(row.percentage_rank)} />
        <MetricTile label="No-back rank" value={formatRankValue(row.no_back_rate_rank)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricTile label="Average CGPA" value={formatMetricValue(row.average_cgpa)} />
        <MetricTile label="Average %" value={formatMetricValue(row.average_percentage, "%")} />
        <MetricTile label="No backs" value={String(row.students_without_backs)} />
        <MetricTile label="No-back rate" value={formatMetricValue(row.no_back_rate, "%")} />
      </div>
    </div>
  );
}

function BatchLeaderboardCard({ row }: { row: BranchAnalyticsBatchLeaderboardRow }) {
  return (
    <div className="rounded-[1.35rem] border border-line bg-surface px-4 py-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-ink">{formatBatchLabel(row.passing_year)}</div>
          <div className="mt-1 text-sm text-slate">{row.total_students} students</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="accent">CGPA {formatRankValue(row.cgpa_rank)}</StatusBadge>
          <StatusBadge tone="info">% {formatRankValue(row.percentage_rank)}</StatusBadge>
          <StatusBadge tone="success">No-back {formatRankValue(row.no_back_rate_rank)}</StatusBadge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-6">
        <MetricTile label="Average CGPA" value={formatMetricValue(row.average_cgpa)} />
        <MetricTile label="Average %" value={formatMetricValue(row.average_percentage, "%")} />
        <MetricTile label="No backs" value={String(row.students_without_backs)} />
        <MetricTile label="With backs" value={String(row.students_with_backs)} />
        <MetricTile label="No-back rate" value={formatMetricValue(row.no_back_rate, "%")} />
        <MetricTile label="Students" value={String(row.total_students)} />
      </div>
    </div>
  );
}
