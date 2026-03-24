"use client";

import { startTransition, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type {
  RankingMetric,
  RankingMetricKey,
  RankingScope,
  RankingScopeKey,
  RankingsPayload
} from "@/lib/queries/rankings";

const DEFAULT_SCOPE: RankingScopeKey = "branch";
const DEFAULT_METRIC: RankingMetricKey = "percentage";

function isScopeKey(value: string | null): value is RankingScopeKey {
  return value === "branch" || value === "batch";
}

function isMetricKey(value: string | null): value is RankingMetricKey {
  return value === "percentage" || value === "cgpa" || value === "latest";
}

function LeaderboardList({ entries }: { entries: RankingMetric["entries"] }) {
  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[88px_minmax(0,1fr)_110px] gap-4 rounded-[1rem] px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist md:grid">
        <div>Rank</div>
        <div>Student</div>
        <div className="text-right">Score</div>
      </div>
      {entries.map((entry) => (
        <div
          key={`${entry.rank}-${entry.student_id}`}
          className={cn(
            "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1.25rem] border px-4 py-3 md:grid-cols-[88px_minmax(0,1fr)_110px] md:gap-4",
            entry.self ? "border-warning bg-warning-soft" : "border-line bg-surface"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("text-sm font-bold", entry.self ? "text-warning" : "text-ink")}>
              #{entry.rank}
            </div>
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink md:text-[15px]">{entry.name}</div>
            <div className="mt-0.5 text-xs text-mist md:hidden">
              {entry.self ? "Your visible row" : "Peer identity masked"}
            </div>
          </div>
          <div className="text-right text-sm font-semibold text-ink md:text-[15px]">{entry.score}</div>
        </div>
      ))}
    </div>
  );
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

export function LeaderboardTabs({
  rankings
}: {
  rankings: RankingsPayload;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawScope = searchParams.get("scope");
  const rawMetric = searchParams.get("metric");
  const scopeKey: RankingScopeKey = isScopeKey(rawScope) ? rawScope : DEFAULT_SCOPE;
  const metricKey: RankingMetricKey = isMetricKey(rawMetric) ? rawMetric : DEFAULT_METRIC;

  const currentScope = rankings.scopes[scopeKey];
  const currentMetric = currentScope.metrics[metricKey];
  const currentScopeLabel = getScopeLabel(currentScope) || "Ranking cohort";
  const updateSearchParam = useMemo(
    () => (key: "scope" | "metric", value: string, defaultValue: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (value === defaultValue) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
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
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)]">
      <SectionBlock
        title="Your position"
        description="The summary and leaderboard now stay in sync with the selected scope and metric."
        className="xl:sticky xl:top-8 xl:self-start"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge tone="warning">
            {currentMetric.self_rank ? `#${currentMetric.self_rank} ${currentScope.key} rank` : "Rank unavailable"}
          </StatusBadge>
          <StatusBadge tone="accent">
            {currentMetric.percentile ? `Top ${currentMetric.percentile}%` : "Percentile unavailable"}
          </StatusBadge>
          {rankings.anchor.passing_year ? <StatusBadge tone="info">Batch {rankings.anchor.passing_year}</StatusBadge> : null}
        </div>
        <p className="text-sm leading-7 text-slate">
          Your own row stays visible. Everyone else is masked by default, and the selected score here is the
          same one used in the table on the right.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Scope</div>
            <div className="mt-2 text-lg font-semibold text-ink">{currentScope.label}</div>
            <div className="mt-1 text-sm text-slate">{currentScope.total_students} students</div>
          </div>
          <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-mist">{currentMetric.score_label}</div>
            <div className="mt-2 text-lg font-semibold text-ink">{currentMetric.self_score ?? "--"}</div>
            <div className="mt-1 text-sm text-slate">{currentScopeLabel}</div>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Leaderboard"
        description="Choose the scope first, then switch the metric. The table and summary will move together."
      >
        <Tabs.Root
          value={scopeKey}
          onValueChange={(value) => {
            if (!isScopeKey(value)) return;
            updateSearchParam("scope", value, DEFAULT_SCOPE);
          }}
          className="space-y-4"
        >
          <Tabs.List className="grid grid-cols-2 gap-2 rounded-[1.4rem] bg-surface-muted p-1 xl:max-w-md">
            {[
              { value: "branch", label: "Branch Wise" },
              { value: "batch", label: "Batch Wise" }
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="rounded-[1rem] px-3 py-2 text-xs font-semibold text-slate data-[state=active]:bg-ink data-[state=active]:text-white"
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Root
            value={metricKey}
            onValueChange={(value) => {
              if (!isMetricKey(value)) return;
              updateSearchParam("metric", value, DEFAULT_METRIC);
            }}
            className="space-y-4"
          >
            <Tabs.List className="grid grid-cols-3 gap-2 rounded-[1.4rem] bg-surface-muted p-1 xl:max-w-2xl">
              {[
                { value: "percentage", label: "Percentage" },
                { value: "cgpa", label: "CGPA" },
                { value: "latest", label: "Latest SGPA" }
              ].map((tab) => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-[1rem] px-3 py-2 text-xs font-semibold text-slate data-[state=active]:bg-ink data-[state=active]:text-white"
                >
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-strong">
              {currentScope.label}
            </span>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">
              {currentScopeLabel}
            </span>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">
              {currentScope.total_students} students
            </span>
            <span className="rounded-full bg-warning-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-warning">
              You highlighted
            </span>
          </div>

          <LeaderboardList entries={currentMetric.entries} />
        </Tabs.Root>
      </SectionBlock>
    </div>
  );
}
