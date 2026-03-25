"use client";

import { startTransition, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import type { RankingMetricKey, RankingScope, RankingScopeKey, RankingsPayload } from "@/lib/queries/rankings";

const DEFAULT_SCOPE: RankingScopeKey = "branch";

function isScopeKey(value: string | null): value is RankingScopeKey {
  return value === "branch" || value === "batch";
}

function formatPercentile(value: number | null) {
  return value ? `Top ${value}%` : "Percentile unavailable";
}

function getScopeLabel(scope: RankingScope) {
  if (scope.key === "branch") {
    return [scope.branch_name, scope.course_name, scope.passing_year ? `Batch ${scope.passing_year}` : null]
      .filter(Boolean)
      .join(" • ");
  }

  return [scope.passing_year ? `Batch ${scope.passing_year}` : null, scope.institute_name]
    .filter(Boolean)
    .join(" • ");
}

function RankCard({
  label,
  scoreLabel,
  score,
  rank,
  totalStudents,
  percentile
}: {
  label: string;
  scoreLabel: string;
  score: string | null;
  rank: number | null;
  totalStudents: number;
  percentile: number | null;
}) {
  return (
    <div className="rounded-[1.4rem] border border-line bg-surface px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-mist">{label}</div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-ink">{rank ? `#${rank}` : "--"}</div>
          <div className="mt-1 text-sm text-slate">
            {totalStudents > 0 ? `${totalStudents} students` : "Cohort unavailable"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.16em] text-mist">{scoreLabel}</div>
          <div className="mt-1 text-lg font-semibold text-ink">{score ?? "--"}</div>
        </div>
      </div>
      <div className="mt-3">
        <StatusBadge tone="accent">{formatPercentile(percentile)}</StatusBadge>
      </div>
    </div>
  );
}

function SemesterRankRow({
  label,
  score,
  rank,
  totalStudents,
  percentile
}: {
  label: string;
  score: string | null;
  rank: number | null;
  totalStudents: number;
  percentile: number | null;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-[1.25rem] border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="mt-1 text-xs text-slate">
          {score ? `SGPA ${score}` : "SGPA unavailable"} • {rank ? `#${rank}` : "Rank unavailable"} •{" "}
          {totalStudents > 0 ? `${totalStudents} students` : "Cohort unavailable"}
        </div>
      </div>
      <StatusBadge tone="warning">{formatPercentile(percentile)}</StatusBadge>
    </div>
  );
}

export function LeaderboardTabs({
  rankings
}: {
  rankings: RankingsPayload;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawScope = searchParams.get("scope");
  const scopeKey: RankingScopeKey = isScopeKey(rawScope) ? rawScope : DEFAULT_SCOPE;
  const currentScope = rankings.scopes[scopeKey];
  const currentScopeLabel = getScopeLabel(currentScope) || "Ranking cohort";
  const metricOrder: RankingMetricKey[] = ["percentage", "cgpa", "latest"];
  const updateSearchParam = useMemo(
    () => (value: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (value === DEFAULT_SCOPE) {
        nextParams.delete("scope");
      } else {
        nextParams.set("scope", value);
      }

      const nextQuery = nextParams.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="space-y-5">
      <SectionBlock
        title="My ranks"
        description="Your rank is fixed until the admin updates academic records and rebuilds the ranking cache."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge tone="warning">{currentScope.label}</StatusBadge>
          {rankings.anchor.passing_year ? <StatusBadge tone="info">Batch {rankings.anchor.passing_year}</StatusBadge> : null}
          <StatusBadge tone="accent">{currentScope.total_students} students</StatusBadge>
        </div>

        <Tabs.Root
          value={scopeKey}
          onValueChange={(value) => {
            if (!isScopeKey(value)) return;
            updateSearchParam(value);
          }}
          className="space-y-5"
        >
          <Tabs.List className="grid grid-cols-2 gap-2 rounded-[1.4rem] bg-surface-muted p-1 xl:max-w-md">
            <Tabs.Trigger
              value="branch"
              className="rounded-[1rem] px-3 py-2 text-xs font-semibold text-slate data-[state=active]:bg-ink data-[state=active]:text-white"
            >
              Branch Wise
            </Tabs.Trigger>
            <Tabs.Trigger
              value="batch"
              className="rounded-[1rem] px-3 py-2 text-xs font-semibold text-slate data-[state=active]:bg-ink data-[state=active]:text-white"
            >
              Batch Wise
            </Tabs.Trigger>
          </Tabs.List>

          <div className="rounded-[1.3rem] bg-app/70 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Cohort</div>
            <div className="mt-2 text-lg font-semibold text-ink">{currentScopeLabel}</div>
            <div className="mt-1 text-sm text-slate">{currentScope.description}</div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {metricOrder.map((metricKey) => {
              const metric = currentScope.metrics[metricKey];
              return (
                <RankCard
                  key={metric.key}
                  label={metric.label}
                  scoreLabel={metric.score_label}
                  score={metric.self_score}
                  rank={metric.self_rank}
                  totalStudents={metric.total_students}
                  percentile={metric.percentile}
                />
              );
            })}
          </div>
        </Tabs.Root>
      </SectionBlock>

      <SectionBlock
        title="Semester ranks"
        description="Semester-wise SGPA ranks are also precomputed and stored for your current cohort."
      >
        <div className="space-y-3">
          {currentScope.semester_metrics.length > 0 ? (
            currentScope.semester_metrics.map((semester) => (
              <SemesterRankRow
                key={semester.semester_no}
                label={semester.label}
                score={semester.self_score}
                rank={semester.self_rank}
                totalStudents={semester.total_students}
                percentile={semester.percentile}
              />
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-line bg-surface px-4 py-6 text-sm text-slate">
              Semester-wise ranks are not available for this scope yet.
            </div>
          )}
        </div>
      </SectionBlock>
    </div>
  );
}
