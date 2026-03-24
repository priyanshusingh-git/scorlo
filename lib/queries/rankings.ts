import "server-only";

import { getSql } from "@/lib/db";

export type RankingMetricKey = "percentage" | "cgpa" | "latest";
export type RankingScopeKey = "branch" | "batch";

export type RankingEntry = {
  student_id: number;
  rank: number;
  name: string;
  score: string;
  self: boolean;
};

export type RankingMetric = {
  key: RankingMetricKey;
  label: string;
  score_label: string;
  self_rank: number | null;
  self_score: string | null;
  total_students: number;
  percentile: number | null;
  entries: RankingEntry[];
};

export type RankingScope = {
  key: RankingScopeKey;
  label: string;
  description: string;
  institute_name: string | null;
  branch_name: string | null;
  course_name: string | null;
  passing_year: number | null;
  total_students: number;
  metrics: Record<RankingMetricKey, RankingMetric>;
};

export type RankingsPayload = {
  anchor: {
    institute_name: string | null;
    branch_name: string | null;
    course_name: string | null;
    passing_year: number | null;
  };
  scopes: Record<RankingScopeKey, RankingScope>;
};

type RankingMetricConfig = {
  key: RankingMetricKey;
  label: string;
  scoreLabel: string;
  column: "overall_percentage" | "cgpa" | "latest_sgpa";
  suffix: string;
};

type RankingScopeConfig = {
  key: RankingScopeKey;
  label: string;
  description: string;
};

type AnchorStudent = {
  id: number;
  institute_name: string | null;
  branch_name: string | null;
  course_name: string | null;
  passing_year: number | null;
};

type RankedRow = {
  student_id: number;
  name: string | null;
  metric_value: string;
  rank: number;
  total_count: number;
};

const RANKING_METRICS: RankingMetricConfig[] = [
  {
    key: "percentage",
    label: "Percentage",
    scoreLabel: "Overall %",
    column: "overall_percentage",
    suffix: "%"
  },
  {
    key: "cgpa",
    label: "CGPA",
    scoreLabel: "CGPA",
    column: "cgpa",
    suffix: ""
  },
  {
    key: "latest",
    label: "Latest SGPA",
    scoreLabel: "Latest SGPA",
    column: "latest_sgpa",
    suffix: ""
  }
];

const RANKING_SCOPES: RankingScopeConfig[] = [
  {
    key: "branch",
    label: "Branch Wise",
    description: "Same institute, branch, course, and batch."
  },
  {
    key: "batch",
    label: "Batch Wise",
    description: "Same institute and passing year across branches."
  }
];

function maskStudentName(name: string | null) {
  if (!name) return "Student";

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}***`)
    .join(" ");
}

function formatScore(value: string, suffix: string) {
  return suffix ? `${value}${suffix}` : value;
}

function computePercentile(rank: number | null, totalStudents: number) {
  if (rank === null || totalStudents <= 0) return null;
  return Math.max(1, Math.ceil((rank / totalStudents) * 100));
}

function selectVisibleEntries(rows: RankedRow[], studentId: number, suffix: string): RankingEntry[] {
  const topRows = rows.slice(0, 20);
  const selfRow = rows.find((row) => row.student_id === studentId) ?? null;
  const visibleRows =
    selfRow && !topRows.some((row) => row.student_id === selfRow.student_id)
      ? [...topRows, selfRow]
      : topRows;

  return visibleRows.map((row) => ({
    student_id: row.student_id,
    rank: row.rank,
    name: row.student_id === studentId ? row.name ?? "You" : maskStudentName(row.name),
    score: formatScore(row.metric_value, suffix),
    self: row.student_id === studentId
  }));
}

async function getAnchorStudent(studentId: number) {
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      institute_name,
      branch_name,
      course_name,
      passing_year
    FROM students
    WHERE id = ${studentId}
    LIMIT 1
  `) as AnchorStudent[];

  return rows[0] ?? null;
}

async function getRankedRows(
  student: AnchorStudent,
  metric: RankingMetricConfig,
  scope: RankingScopeConfig
) {
  const sql = getSql();

  if (metric.column === "overall_percentage" && scope.key === "branch") {
    return (await sql`
      WITH scoped AS (
        SELECT
          s.id AS student_id,
          s.name,
          sm.overall_percentage::text AS metric_value
        FROM students s
        JOIN student_metrics sm ON sm.student_id = s.id
        WHERE COALESCE(s.institute_name, '') = COALESCE(${student.institute_name}, '')
          AND COALESCE(s.branch_name, '') = COALESCE(${student.branch_name}, '')
          AND COALESCE(s.course_name, '') = COALESCE(${student.course_name}, '')
          AND s.passing_year IS NOT DISTINCT FROM ${student.passing_year}
          AND sm.overall_percentage IS NOT NULL
      ),
      ranked AS (
        SELECT
          student_id,
          name,
          metric_value,
          DENSE_RANK() OVER (ORDER BY metric_value::numeric DESC) AS rank,
          COUNT(*) OVER () AS total_count
        FROM scoped
      )
      SELECT student_id, name, metric_value, rank, total_count
      FROM ranked
      ORDER BY rank ASC, name ASC
    `) as RankedRow[];
  }

  if (metric.column === "overall_percentage" && scope.key === "batch") {
    return (await sql`
      WITH scoped AS (
        SELECT
          s.id AS student_id,
          s.name,
          sm.overall_percentage::text AS metric_value
        FROM students s
        JOIN student_metrics sm ON sm.student_id = s.id
        WHERE COALESCE(s.institute_name, '') = COALESCE(${student.institute_name}, '')
          AND s.passing_year IS NOT DISTINCT FROM ${student.passing_year}
          AND sm.overall_percentage IS NOT NULL
      ),
      ranked AS (
        SELECT
          student_id,
          name,
          metric_value,
          DENSE_RANK() OVER (ORDER BY metric_value::numeric DESC) AS rank,
          COUNT(*) OVER () AS total_count
        FROM scoped
      )
      SELECT student_id, name, metric_value, rank, total_count
      FROM ranked
      ORDER BY rank ASC, name ASC
    `) as RankedRow[];
  }

  if (metric.column === "cgpa" && scope.key === "branch") {
    return (await sql`
      WITH scoped AS (
        SELECT
          s.id AS student_id,
          s.name,
          sm.cgpa::text AS metric_value
        FROM students s
        JOIN student_metrics sm ON sm.student_id = s.id
        WHERE COALESCE(s.institute_name, '') = COALESCE(${student.institute_name}, '')
          AND COALESCE(s.branch_name, '') = COALESCE(${student.branch_name}, '')
          AND COALESCE(s.course_name, '') = COALESCE(${student.course_name}, '')
          AND s.passing_year IS NOT DISTINCT FROM ${student.passing_year}
          AND sm.cgpa IS NOT NULL
      ),
      ranked AS (
        SELECT
          student_id,
          name,
          metric_value,
          DENSE_RANK() OVER (ORDER BY metric_value::numeric DESC) AS rank,
          COUNT(*) OVER () AS total_count
        FROM scoped
      )
      SELECT student_id, name, metric_value, rank, total_count
      FROM ranked
      ORDER BY rank ASC, name ASC
    `) as RankedRow[];
  }

  if (metric.column === "cgpa" && scope.key === "batch") {
    return (await sql`
      WITH scoped AS (
        SELECT
          s.id AS student_id,
          s.name,
          sm.cgpa::text AS metric_value
        FROM students s
        JOIN student_metrics sm ON sm.student_id = s.id
        WHERE COALESCE(s.institute_name, '') = COALESCE(${student.institute_name}, '')
          AND s.passing_year IS NOT DISTINCT FROM ${student.passing_year}
          AND sm.cgpa IS NOT NULL
      ),
      ranked AS (
        SELECT
          student_id,
          name,
          metric_value,
          DENSE_RANK() OVER (ORDER BY metric_value::numeric DESC) AS rank,
          COUNT(*) OVER () AS total_count
        FROM scoped
      )
      SELECT student_id, name, metric_value, rank, total_count
      FROM ranked
      ORDER BY rank ASC, name ASC
    `) as RankedRow[];
  }

  if (scope.key === "branch") {
    return (await sql`
      WITH scoped AS (
        SELECT
          s.id AS student_id,
          s.name,
          sm.latest_sgpa::text AS metric_value
        FROM students s
        JOIN student_metrics sm ON sm.student_id = s.id
        WHERE COALESCE(s.institute_name, '') = COALESCE(${student.institute_name}, '')
          AND COALESCE(s.branch_name, '') = COALESCE(${student.branch_name}, '')
          AND COALESCE(s.course_name, '') = COALESCE(${student.course_name}, '')
          AND s.passing_year IS NOT DISTINCT FROM ${student.passing_year}
          AND sm.latest_sgpa IS NOT NULL
      ),
      ranked AS (
        SELECT
          student_id,
          name,
          metric_value,
          DENSE_RANK() OVER (ORDER BY metric_value::numeric DESC) AS rank,
          COUNT(*) OVER () AS total_count
        FROM scoped
      )
      SELECT student_id, name, metric_value, rank, total_count
      FROM ranked
      ORDER BY rank ASC, name ASC
    `) as RankedRow[];
  }

  return (await sql`
    WITH scoped AS (
      SELECT
        s.id AS student_id,
        s.name,
        sm.latest_sgpa::text AS metric_value
      FROM students s
      JOIN student_metrics sm ON sm.student_id = s.id
      WHERE COALESCE(s.institute_name, '') = COALESCE(${student.institute_name}, '')
        AND s.passing_year IS NOT DISTINCT FROM ${student.passing_year}
        AND sm.latest_sgpa IS NOT NULL
    ),
    ranked AS (
      SELECT
        student_id,
        name,
        metric_value,
        DENSE_RANK() OVER (ORDER BY metric_value::numeric DESC) AS rank,
        COUNT(*) OVER () AS total_count
      FROM scoped
    )
    SELECT student_id, name, metric_value, rank, total_count
    FROM ranked
    ORDER BY rank ASC, name ASC
  `) as RankedRow[];
}

async function getMetricRanking(
  student: AnchorStudent,
  metric: RankingMetricConfig,
  scope: RankingScopeConfig
) {
  const rows = await getRankedRows(student, metric, scope);
  const selfRow = rows.find((row) => row.student_id === student.id) ?? null;
  const totalStudents = rows[0]?.total_count ?? 0;

  return {
    key: metric.key,
    label: metric.label,
    score_label: metric.scoreLabel,
    self_rank: selfRow?.rank ?? null,
    self_score: selfRow ? formatScore(selfRow.metric_value, metric.suffix) : null,
    total_students: totalStudents,
    percentile: computePercentile(selfRow?.rank ?? null, totalStudents),
    entries: selectVisibleEntries(rows, student.id, metric.suffix)
  } satisfies RankingMetric;
}

async function getScopeRankings(student: AnchorStudent, scope: RankingScopeConfig) {
  const metricResults = await Promise.all(
    RANKING_METRICS.map((metric) => getMetricRanking(student, metric, scope))
  );
  const totalStudents = metricResults.find((metric) => metric.total_students > 0)?.total_students ?? 0;

  return {
    key: scope.key,
    label: scope.label,
    description: scope.description,
    institute_name: student.institute_name,
    branch_name: student.branch_name,
    course_name: student.course_name,
    passing_year: student.passing_year,
    total_students: totalStudents,
    metrics: {
      percentage: metricResults.find((metric) => metric.key === "percentage")!,
      cgpa: metricResults.find((metric) => metric.key === "cgpa")!,
      latest: metricResults.find((metric) => metric.key === "latest")!
    }
  } satisfies RankingScope;
}

export async function getRankingsForStudent(studentId: number): Promise<RankingsPayload | null> {
  const student = await getAnchorStudent(studentId);
  if (!student) return null;

  const scopeResults = await Promise.all(
    RANKING_SCOPES.map((scope) => getScopeRankings(student, scope))
  );

  return {
    anchor: {
      institute_name: student.institute_name,
      branch_name: student.branch_name,
      course_name: student.course_name,
      passing_year: student.passing_year
    },
    scopes: {
      branch: scopeResults.find((scope) => scope.key === "branch")!,
      batch: scopeResults.find((scope) => scope.key === "batch")!
    }
  };
}
