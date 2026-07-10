import "server-only";

import { formatMetric, parseNumericMetric } from "@/lib/aktu-metrics";
import { getSql } from "@/lib/db";
import type { StaffType } from "@/lib/staff-access";

export type BranchAnalyticsFilterOptions = {
  institutes: string[];
  courses: string[];
  batches: number[];
  branches: string[];
};

export type BranchAnalyticsLeaderboardRow = {
  branch_name: string;
  total_students: number;
  average_cgpa: string | null;
  average_percentage: string | null;
  students_without_backs: number;
  students_with_backs: number;
  no_back_rate: string | null;
  cgpa_rank: number | null;
  percentage_rank: number | null;
  no_back_rate_rank: number | null;
};

export type BranchAnalyticsSelectedBranchOverview = BranchAnalyticsLeaderboardRow & {
  institute_name: string;
  course_name: string;
  passing_year: number | null;
};

export type BranchAnalyticsBatchLeaderboardRow = {
  passing_year: number;
  total_students: number;
  average_cgpa: string | null;
  average_percentage: string | null;
  students_without_backs: number;
  students_with_backs: number;
  no_back_rate: string | null;
  cgpa_rank: number | null;
  percentage_rank: number | null;
  no_back_rate_rank: number | null;
};

export type BranchAnalyticsPayload = {
  access_mode: "main_admin" | "branch_scoped";
  scoped_branch_name: string | null;
  peer_leaderboard_hidden: boolean;
  filters: {
    selected_institute: string | null;
    selected_course: string | null;
    selected_batch: number | null;
    selected_branch: string | null;
    options: BranchAnalyticsFilterOptions;
  };
  leaderboard: BranchAnalyticsLeaderboardRow[];
  selected_branch_overview: BranchAnalyticsSelectedBranchOverview | null;
  batch_leaderboard: BranchAnalyticsBatchLeaderboardRow[];
  empty_state: string | null;
};

type AggregateMetrics = {
  total_students: number;
  average_cgpa: string | null;
  average_percentage: string | null;
  students_without_backs: number;
  students_with_backs: number;
  no_back_rate: string | null;
};

type BranchAggregateRow = AggregateMetrics & {
  branch_name: string;
};

type BatchAggregateRow = AggregateMetrics & {
  passing_year: number;
};

type RankedMetricKey = "average_cgpa" | "average_percentage" | "no_back_rate";

function normalizeTextFilter(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function parseBatchFilter(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : null;
  }

  const normalized = normalizeTextFilter(value);
  if (!normalized) return null;

  const parsed = Number.parseInt(normalized, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function compareNullableNumberDesc(left: number | null, right: number | null) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return right - left;
}

function compareLabelAsc(left: string, right: string) {
  return left.localeCompare(right, "en", { sensitivity: "base" });
}

function formatAggregateMetric(value: string | null) {
  const numeric = parseNumericMetric(value);
  return formatMetric(numeric);
}

function buildRanks<T extends AggregateMetrics>(
  rows: T[],
  getLabel: (row: T) => string
) {
  const rankMaps: Record<RankedMetricKey, Map<string, number>> = {
    average_cgpa: new Map<string, number>(),
    average_percentage: new Map<string, number>(),
    no_back_rate: new Map<string, number>()
  };

  const rankOrder: Array<{
    key: RankedMetricKey;
    tieBreakers: RankedMetricKey[];
  }> = [
    {
      key: "average_cgpa",
      tieBreakers: ["average_percentage", "no_back_rate"]
    },
    {
      key: "average_percentage",
      tieBreakers: ["average_cgpa", "no_back_rate"]
    },
    {
      key: "no_back_rate",
      tieBreakers: ["average_cgpa", "average_percentage"]
    }
  ];

  for (const { key, tieBreakers } of rankOrder) {
    const sorted = rows
      .filter((row) => parseNumericMetric(row[key]) !== null)
      .sort((left, right) => {
      const primary = compareNullableNumberDesc(
        parseNumericMetric(left[key]),
        parseNumericMetric(right[key])
      );
      if (primary !== 0) return primary;

      for (const tieBreakerKey of tieBreakers) {
        const tieBreaker = compareNullableNumberDesc(
          parseNumericMetric(left[tieBreakerKey]),
          parseNumericMetric(right[tieBreakerKey])
        );
        if (tieBreaker !== 0) return tieBreaker;
      }

      if (right.total_students !== left.total_students) {
        return right.total_students - left.total_students;
      }

      return compareLabelAsc(getLabel(left), getLabel(right));
      });

    sorted.forEach((row, index) => {
      rankMaps[key].set(getLabel(row), index + 1);
    });
  }

  return rankMaps;
}

function formatBranchRows(rows: BranchAggregateRow[]): BranchAnalyticsLeaderboardRow[] {
  const rankMaps = buildRanks(rows, (row) => row.branch_name);

  return rows
    .map((row) => ({
      branch_name: row.branch_name,
      total_students: row.total_students,
      average_cgpa: formatAggregateMetric(row.average_cgpa),
      average_percentage: formatAggregateMetric(row.average_percentage),
      students_without_backs: row.students_without_backs,
      students_with_backs: row.students_with_backs,
      no_back_rate: formatAggregateMetric(row.no_back_rate),
      cgpa_rank: rankMaps.average_cgpa.get(row.branch_name) ?? null,
      percentage_rank: rankMaps.average_percentage.get(row.branch_name) ?? null,
      no_back_rate_rank: rankMaps.no_back_rate.get(row.branch_name) ?? null
    }))
    .sort((left, right) => {
      return (
        compareNullableNumberAsc(left.cgpa_rank, right.cgpa_rank) ||
        compareNullableNumberAsc(left.percentage_rank, right.percentage_rank) ||
        compareNullableNumberAsc(left.no_back_rate_rank, right.no_back_rate_rank) ||
        compareLabelAsc(left.branch_name, right.branch_name)
      );
    });
}

function formatBatchRows(rows: BatchAggregateRow[]): BranchAnalyticsBatchLeaderboardRow[] {
  const rankMaps = buildRanks(rows, (row) => String(row.passing_year));

  return rows
    .map((row) => ({
      passing_year: row.passing_year,
      total_students: row.total_students,
      average_cgpa: formatAggregateMetric(row.average_cgpa),
      average_percentage: formatAggregateMetric(row.average_percentage),
      students_without_backs: row.students_without_backs,
      students_with_backs: row.students_with_backs,
      no_back_rate: formatAggregateMetric(row.no_back_rate),
      cgpa_rank: rankMaps.average_cgpa.get(String(row.passing_year)) ?? null,
      percentage_rank: rankMaps.average_percentage.get(String(row.passing_year)) ?? null,
      no_back_rate_rank: rankMaps.no_back_rate.get(String(row.passing_year)) ?? null
    }))
    .sort((left, right) => {
      return (
        compareNullableNumberAsc(left.cgpa_rank, right.cgpa_rank) ||
        compareNullableNumberAsc(left.percentage_rank, right.percentage_rank) ||
        compareNullableNumberAsc(left.no_back_rate_rank, right.no_back_rate_rank) ||
        right.passing_year - left.passing_year
      );
    });
}

function compareNullableNumberAsc(left: number | null, right: number | null) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
}

async function getAvailableInstitutes(scopedBranch: string | null) {
  const sql = getSql();
  const rows = (await sql`
    SELECT DISTINCT s.institute_name
    FROM students s
    JOIN student_metrics sm ON sm.student_id = s.id
    WHERE COALESCE(s.institute_name, '') <> ''
      AND COALESCE(s.course_name, '') <> ''
      AND COALESCE(s.branch_name, '') <> ''
      AND (${scopedBranch ?? ""} = '' OR COALESCE(s.branch_name, '') = ${scopedBranch ?? ""})
    ORDER BY s.institute_name ASC
  `) as Array<{ institute_name: string }>;

  return rows.map((row) => row.institute_name);
}

async function getAvailableCourses({
  scopedBranch,
  institute
}: {
  scopedBranch: string | null;
  institute: string;
}) {
  const sql = getSql();
  const rows = (await sql`
    SELECT DISTINCT s.course_name
    FROM students s
    JOIN student_metrics sm ON sm.student_id = s.id
    WHERE COALESCE(s.institute_name, '') = ${institute}
      AND COALESCE(s.course_name, '') <> ''
      AND COALESCE(s.branch_name, '') <> ''
      AND (${scopedBranch ?? ""} = '' OR COALESCE(s.branch_name, '') = ${scopedBranch ?? ""})
    ORDER BY s.course_name ASC
  `) as Array<{ course_name: string }>;

  return rows.map((row) => row.course_name);
}

async function getAvailableBatches({
  institute,
  course,
  branch
}: {
  institute: string;
  course: string;
  branch: string | null;
}) {
  const sql = getSql();
  const rows = (await sql`
    SELECT DISTINCT s.passing_year
    FROM students s
    JOIN student_metrics sm ON sm.student_id = s.id
    WHERE COALESCE(s.institute_name, '') = ${institute}
      AND COALESCE(s.course_name, '') = ${course}
      AND s.passing_year IS NOT NULL
      AND COALESCE(s.branch_name, '') <> ''
      AND (${branch ?? ""} = '' OR COALESCE(s.branch_name, '') = ${branch ?? ""})
    ORDER BY s.passing_year DESC
  `) as Array<{ passing_year: number }>;

  return rows.map((row) => row.passing_year);
}

async function getBranchLeaderboardRows({
  institute,
  course,
  batch
}: {
  institute: string;
  course: string;
  batch: number | null;
}) {
  const sql = getSql();
  return (await sql`
    SELECT
      s.branch_name,
      COUNT(*)::int AS total_students,
      ROUND(AVG(sm.cgpa)::numeric, 2)::text AS average_cgpa,
      ROUND(AVG(sm.overall_percentage)::numeric, 2)::text AS average_percentage,
      SUM(CASE WHEN sm.active_backs = 0 THEN 1 ELSE 0 END)::int AS students_without_backs,
      SUM(CASE WHEN sm.active_backs > 0 THEN 1 ELSE 0 END)::int AS students_with_backs,
      ROUND(
        (SUM(CASE WHEN sm.active_backs = 0 THEN 1 ELSE 0 END)::numeric * 100.0) / NULLIF(COUNT(*), 0),
        2
      )::text AS no_back_rate
    FROM students s
    JOIN student_metrics sm ON sm.student_id = s.id
    WHERE COALESCE(s.institute_name, '') = ${institute}
      AND COALESCE(s.course_name, '') = ${course}
      AND COALESCE(s.branch_name, '') <> ''
      AND (${batch === null} OR s.passing_year = ${batch})
    GROUP BY s.branch_name
  `) as BranchAggregateRow[];
}

async function getBatchLeaderboardRows({
  institute,
  course,
  branch,
  batch
}: {
  institute: string;
  course: string;
  branch: string;
  batch: number | null;
}) {
  const sql = getSql();
  return (await sql`
    SELECT
      s.passing_year,
      COUNT(*)::int AS total_students,
      ROUND(AVG(sm.cgpa)::numeric, 2)::text AS average_cgpa,
      ROUND(AVG(sm.overall_percentage)::numeric, 2)::text AS average_percentage,
      SUM(CASE WHEN sm.active_backs = 0 THEN 1 ELSE 0 END)::int AS students_without_backs,
      SUM(CASE WHEN sm.active_backs > 0 THEN 1 ELSE 0 END)::int AS students_with_backs,
      ROUND(
        (SUM(CASE WHEN sm.active_backs = 0 THEN 1 ELSE 0 END)::numeric * 100.0) / NULLIF(COUNT(*), 0),
        2
      )::text AS no_back_rate
    FROM students s
    JOIN student_metrics sm ON sm.student_id = s.id
    WHERE COALESCE(s.institute_name, '') = ${institute}
      AND COALESCE(s.course_name, '') = ${course}
      AND COALESCE(s.branch_name, '') = ${branch}
      AND s.passing_year IS NOT NULL
      AND (${batch === null} OR s.passing_year = ${batch})
    GROUP BY s.passing_year
  `) as BatchAggregateRow[];
}

export async function getBranchAnalytics({
  staffType,
  scopedBranch,
  institute,
  course,
  batch,
  branch
}: {
  staffType: StaffType;
  scopedBranch: string | null;
  institute?: string | null;
  course?: string | null;
  batch?: string | number | null;
  branch?: string | null;
}): Promise<BranchAnalyticsPayload> {
  const branchScopeEnforced = staffType !== "main_admin";
  const normalizedScopedBranch = normalizeTextFilter(scopedBranch) || null;

  if (branchScopeEnforced && !normalizedScopedBranch) {
    return {
      access_mode: "branch_scoped",
      scoped_branch_name: null,
      peer_leaderboard_hidden: true,
      filters: {
        selected_institute: null,
        selected_course: null,
        selected_batch: null,
        selected_branch: null,
        options: {
          institutes: [],
          courses: [],
          batches: [],
          branches: []
        }
      },
      leaderboard: [],
      selected_branch_overview: null,
      batch_leaderboard: [],
      empty_state: "Your account does not have a branch assignment yet."
    };
  }

  const availableInstitutes = await getAvailableInstitutes(normalizedScopedBranch);
  const selectedInstitute =
    availableInstitutes.find((value) => value === normalizeTextFilter(institute)) ??
    availableInstitutes[0] ??
    null;

  if (!selectedInstitute) {
    return {
      access_mode: branchScopeEnforced ? "branch_scoped" : "main_admin",
      scoped_branch_name: normalizedScopedBranch,
      peer_leaderboard_hidden: branchScopeEnforced,
      filters: {
        selected_institute: null,
        selected_course: null,
        selected_batch: null,
        selected_branch: normalizedScopedBranch,
        options: {
          institutes: [],
          courses: [],
          batches: [],
          branches: normalizedScopedBranch ? [normalizedScopedBranch] : []
        }
      },
      leaderboard: [],
      selected_branch_overview: null,
      batch_leaderboard: [],
      empty_state: "No branch analytics data is available yet."
    };
  }

  const availableCourses = await getAvailableCourses({
    scopedBranch: normalizedScopedBranch,
    institute: selectedInstitute
  });
  const selectedCourse =
    availableCourses.find((value) => value === normalizeTextFilter(course)) ??
    availableCourses[0] ??
    null;

  if (!selectedCourse) {
    return {
      access_mode: branchScopeEnforced ? "branch_scoped" : "main_admin",
      scoped_branch_name: normalizedScopedBranch,
      peer_leaderboard_hidden: branchScopeEnforced,
      filters: {
        selected_institute: selectedInstitute,
        selected_course: null,
        selected_batch: null,
        selected_branch: normalizedScopedBranch,
        options: {
          institutes: availableInstitutes,
          courses: [],
          batches: [],
          branches: normalizedScopedBranch ? [normalizedScopedBranch] : []
        }
      },
      leaderboard: [],
      selected_branch_overview: null,
      batch_leaderboard: [],
      empty_state: "No courses with analytics data were found for the selected institute."
    };
  }

  const batchOptions = await getAvailableBatches({
    institute: selectedInstitute,
    course: selectedCourse,
    branch: branchScopeEnforced ? normalizedScopedBranch : null
  });
  const requestedBatch = parseBatchFilter(batch);
  const selectedBatch = batchOptions.includes(requestedBatch ?? Number.NaN) ? requestedBatch : null;

  const leaderboard = formatBranchRows(
    await getBranchLeaderboardRows({
      institute: selectedInstitute,
      course: selectedCourse,
      batch: selectedBatch
    })
  );

  const branchOptions = branchScopeEnforced
    ? normalizedScopedBranch
      ? [normalizedScopedBranch]
      : []
    : leaderboard.map((row) => row.branch_name);

  const requestedBranch = normalizeTextFilter(branch);
  const selectedBranch = branchScopeEnforced
    ? normalizedScopedBranch
    : branchOptions.find((value) => value === requestedBranch) ?? leaderboard[0]?.branch_name ?? null;

  const selectedBranchOverviewRow =
    selectedBranch !== null ? leaderboard.find((row) => row.branch_name === selectedBranch) ?? null : null;
  const batchLeaderboard =
    selectedBranch !== null
      ? formatBatchRows(
          await getBatchLeaderboardRows({
            institute: selectedInstitute,
            course: selectedCourse,
            branch: selectedBranch,
            batch: selectedBatch
          })
        )
      : [];

  const selectedBranchOverview =
    selectedBranchOverviewRow && selectedBranch
      ? {
          ...selectedBranchOverviewRow,
          institute_name: selectedInstitute,
          course_name: selectedCourse,
          passing_year: selectedBatch
        }
      : null;

  const emptyState =
    leaderboard.length === 0
      ? selectedBatch !== null
        ? "No branch data matched the current institute, course, and batch filters."
        : "No branch data matched the current institute and course filters."
      : branchScopeEnforced && !selectedBranchOverview
        ? "No analytics rows were found for your branch in the current filter set."
        : null;

  return {
    access_mode: branchScopeEnforced ? "branch_scoped" : "main_admin",
    scoped_branch_name: normalizedScopedBranch,
    peer_leaderboard_hidden: branchScopeEnforced,
    filters: {
      selected_institute: selectedInstitute,
      selected_course: selectedCourse,
      selected_batch: selectedBatch,
      selected_branch: selectedBranch,
      options: {
        institutes: availableInstitutes,
        courses: availableCourses,
        batches: batchOptions,
        branches: branchOptions
      }
    },
    leaderboard,
    selected_branch_overview: selectedBranchOverview,
    batch_leaderboard: batchLeaderboard,
    empty_state: emptyState
  };
}
