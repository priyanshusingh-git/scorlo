import "server-only";

import {
  computeAktuWeightedCgpa,
  formatMetric,
  parseNumericMetric
} from "@/lib/aktu-metrics";
import { getSql } from "@/lib/db";

export type RankingMetricKey = "percentage" | "cgpa" | "latest";
export type RankingScopeKey = "branch" | "batch";

export type RankingMetric = {
  key: RankingMetricKey;
  label: string;
  score_label: string;
  self_rank: number | null;
  self_score: string | null;
  total_students: number;
  percentile: number | null;
};

export type SemesterRankingMetric = {
  semester_no: number;
  label: string;
  score_label: string;
  self_rank: number | null;
  self_score: string | null;
  total_students: number;
  percentile: number | null;
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
  semester_metrics: SemesterRankingMetric[];
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

type ScopeDatasetRow = {
  student_id: number;
  name: string | null;
  roll_no: string;
  overall_percentage: string | null;
  latest_sgpa: string | null;
  active_backs: number;
  marks_obtained: number | null;
  semester_no: number | null;
  semester_sgpa: string | null;
};

type ScopedStudent = {
  student_id: number;
  name: string | null;
  roll_no: string;
  overall_percentage: number | null;
  latest_sgpa: number | null;
  active_backs: number;
  marks_obtained: number | null;
  cgpa: number | null;
};

type RankedCandidate = ScopedStudent & {
  score: number;
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

function formatScore(value: string | number, suffix: string) {
  return suffix ? `${value}${suffix}` : String(value);
}

function computePercentile(rank: number | null, totalStudents: number) {
  if (rank === null || totalStudents <= 0) return null;
  return Math.max(1, Math.ceil((rank / totalStudents) * 100));
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

async function getCachedMetricRanking(
  student: AnchorStudent,
  scope: RankingScopeConfig,
  metric: RankingMetricConfig
) {
  const sql = getSql();

  const rows = (await sql`
    SELECT
      sr.score::text AS score,
      sr.rank,
      sr.total_students
    FROM student_rankings sr
    WHERE sr.scope_key = ${scope.key}
      AND sr.metric_key = ${metric.key}
      AND sr.semester_no = 0
      AND sr.student_id = ${student.id}
    LIMIT 1
  `) as Array<{
    score: string;
    rank: number;
    total_students: number;
  }>;
  const selfRow = rows[0] ?? null;
  if (!selfRow) return null;

  const totalStudents = selfRow.total_students;

  return {
    key: metric.key,
    label: metric.label,
    score_label: metric.scoreLabel,
    self_rank: selfRow.rank,
    self_score: formatScore(selfRow.score, metric.suffix),
    total_students: totalStudents,
    percentile: computePercentile(selfRow.rank, totalStudents)
  } satisfies RankingMetric;
}

async function getScopeDataset(student: AnchorStudent, scope: RankingScopeConfig) {
  const sql = getSql();

  if (scope.key === "branch") {
    return (await sql`
      WITH scoped_students AS (
        SELECT
          s.id AS student_id,
          s.name,
          s.roll_no,
          sm.overall_percentage::text AS overall_percentage,
          sm.latest_sgpa::text AS latest_sgpa,
          sm.active_backs
        FROM students s
        JOIN student_metrics sm ON sm.student_id = s.id
        WHERE COALESCE(s.institute_name, '') = COALESCE(${student.institute_name}, '')
          AND COALESCE(s.branch_name, '') = COALESCE(${student.branch_name}, '')
          AND COALESCE(s.course_name, '') = COALESCE(${student.course_name}, '')
          AND s.passing_year IS NOT DISTINCT FROM ${student.passing_year}
      ),
      latest_marks AS (
        SELECT DISTINCT ON (rs.student_id)
          rs.student_id,
          rs.marks_obtained
        FROM result_sessions rs
        JOIN scoped_students ss ON ss.student_id = rs.student_id
        ORDER BY rs.student_id, rs.created_at DESC NULLS LAST, rs.id DESC
      ),
      ranked_semesters AS (
        SELECT
          rs.student_id,
          sr.semester_no,
          sr.sgpa::text AS semester_sgpa,
          ROW_NUMBER() OVER (
            PARTITION BY rs.student_id, sr.semester_no
            ORDER BY
              rs.session_id DESC NULLS LAST,
              CASE WHEN UPPER(COALESCE(rs.session_type, '')) = 'BACK' THEN 1 ELSE 0 END DESC,
              sr.date_of_declaration DESC NULLS LAST,
              sr.id DESC
          ) AS row_no
        FROM semester_results sr
        JOIN result_sessions rs ON rs.id = sr.result_session_id
        JOIN scoped_students ss ON ss.student_id = rs.student_id
      )
      SELECT
        ss.student_id,
        ss.name,
        ss.roll_no,
        ss.overall_percentage,
        ss.latest_sgpa,
        ss.active_backs,
        lm.marks_obtained,
        rsem.semester_no,
        rsem.semester_sgpa
      FROM scoped_students ss
      LEFT JOIN latest_marks lm ON lm.student_id = ss.student_id
      LEFT JOIN ranked_semesters rsem
        ON rsem.student_id = ss.student_id
       AND rsem.row_no = 1
      ORDER BY ss.student_id ASC, rsem.semester_no ASC
    `) as ScopeDatasetRow[];
  }

  return (await sql`
    WITH scoped_students AS (
      SELECT
        s.id AS student_id,
        s.name,
        s.roll_no,
        sm.overall_percentage::text AS overall_percentage,
        sm.latest_sgpa::text AS latest_sgpa,
        sm.active_backs
      FROM students s
      JOIN student_metrics sm ON sm.student_id = s.id
      WHERE COALESCE(s.institute_name, '') = COALESCE(${student.institute_name}, '')
        AND s.passing_year IS NOT DISTINCT FROM ${student.passing_year}
    ),
    latest_marks AS (
      SELECT DISTINCT ON (rs.student_id)
        rs.student_id,
        rs.marks_obtained
      FROM result_sessions rs
      JOIN scoped_students ss ON ss.student_id = rs.student_id
      ORDER BY rs.student_id, rs.created_at DESC NULLS LAST, rs.id DESC
    ),
    ranked_semesters AS (
      SELECT
        rs.student_id,
        sr.semester_no,
        sr.sgpa::text AS semester_sgpa,
        ROW_NUMBER() OVER (
          PARTITION BY rs.student_id, sr.semester_no
          ORDER BY
            rs.session_id DESC NULLS LAST,
            CASE WHEN UPPER(COALESCE(rs.session_type, '')) = 'BACK' THEN 1 ELSE 0 END DESC,
            sr.date_of_declaration DESC NULLS LAST,
            sr.id DESC
        ) AS row_no
      FROM semester_results sr
      JOIN result_sessions rs ON rs.id = sr.result_session_id
      JOIN scoped_students ss ON ss.student_id = rs.student_id
    )
    SELECT
      ss.student_id,
      ss.name,
      ss.roll_no,
      ss.overall_percentage,
      ss.latest_sgpa,
      ss.active_backs,
      lm.marks_obtained,
      rsem.semester_no,
      rsem.semester_sgpa
    FROM scoped_students ss
    LEFT JOIN latest_marks lm ON lm.student_id = ss.student_id
    LEFT JOIN ranked_semesters rsem
      ON rsem.student_id = ss.student_id
     AND rsem.row_no = 1
    ORDER BY ss.student_id ASC, rsem.semester_no ASC
  `) as ScopeDatasetRow[];
}

function buildScopedStudents(rows: ScopeDatasetRow[]) {
  const students = new Map<
    number,
    ScopedStudent & { semesters: Array<{ semester_no: number; sgpa: string | null }> }
  >();

  for (const row of rows) {
    const existing = students.get(row.student_id) ?? {
      student_id: row.student_id,
      name: row.name,
      roll_no: row.roll_no,
      overall_percentage: parseNumericMetric(row.overall_percentage),
      latest_sgpa: parseNumericMetric(row.latest_sgpa),
      active_backs: row.active_backs,
      marks_obtained: row.marks_obtained,
      cgpa: null,
      semesters: []
    };

    if (row.semester_no !== null) {
      existing.semesters.push({
        semester_no: row.semester_no,
        sgpa: row.semester_sgpa
      });
    }

    students.set(row.student_id, existing);
  }

  return Array.from(students.values()).map((student) => ({
    student_id: student.student_id,
    name: student.name,
    roll_no: student.roll_no,
    overall_percentage: student.overall_percentage,
    latest_sgpa: student.latest_sgpa,
    active_backs: student.active_backs,
    marks_obtained: student.marks_obtained,
    cgpa: computeAktuWeightedCgpa(student.semesters)
  })) satisfies ScopedStudent[];
}

function compareNullableNumberDesc(left: number | null, right: number | null) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return right - left;
}

function compareNullableNumberAsc(left: number | null, right: number | null) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
}

function compareStringAsc(left: string, right: string) {
  return left.localeCompare(right, "en", { sensitivity: "base" });
}

function buildRankedCandidates(
  students: ScopedStudent[],
  metric: RankingMetricConfig
) {
  const withScores = students
    .map((student) => ({
      ...student,
      score:
        metric.key === "percentage"
          ? student.overall_percentage
          : metric.key === "cgpa"
            ? student.cgpa
            : student.latest_sgpa
    }))
    .filter((student): student is RankedCandidate => student.score !== null);

  withScores.sort((left, right) => {
    const primary = compareNullableNumberDesc(left.score, right.score);
    if (primary !== 0) return primary;

    if (metric.key === "percentage") {
      return (
        compareNullableNumberDesc(left.cgpa, right.cgpa) ||
        compareNullableNumberAsc(left.active_backs, right.active_backs) ||
        compareNullableNumberDesc(left.latest_sgpa, right.latest_sgpa) ||
        compareStringAsc(left.roll_no, right.roll_no)
      );
    }

    if (metric.key === "cgpa") {
      return (
        compareNullableNumberDesc(left.overall_percentage, right.overall_percentage) ||
        compareNullableNumberAsc(left.active_backs, right.active_backs) ||
        compareNullableNumberDesc(left.latest_sgpa, right.latest_sgpa) ||
        compareStringAsc(left.roll_no, right.roll_no)
      );
    }

    return (
      compareNullableNumberDesc(left.marks_obtained, right.marks_obtained) ||
      compareNullableNumberAsc(left.active_backs, right.active_backs) ||
      compareStringAsc(left.roll_no, right.roll_no)
    );
  });

  return withScores.map((student, index) => ({
    student_id: student.student_id,
    name: student.name,
    score: student.score,
    rank: index + 1
  }));
}

function buildSemesterRankedCandidates(rows: ScopeDatasetRow[]) {
  const bySemester = new Map<
    number,
    Array<{
      student_id: number;
      score: number;
      marks_obtained: number | null;
      active_backs: number;
      roll_no: string;
    }>
  >();

  for (const row of rows) {
    const semesterNo = row.semester_no;
    const score = parseNumericMetric(row.semester_sgpa);
    if (semesterNo === null || score === null) continue;

    const entry = bySemester.get(semesterNo) ?? [];
    entry.push({
      student_id: row.student_id,
      score,
      marks_obtained: row.marks_obtained,
      active_backs: row.active_backs,
      roll_no: row.roll_no
    });
    bySemester.set(semesterNo, entry);
  }

  return Array.from(bySemester.entries())
    .map(([semester_no, students]) => {
      students.sort((left, right) => {
        return (
          compareNullableNumberDesc(left.score, right.score) ||
          compareNullableNumberDesc(left.marks_obtained, right.marks_obtained) ||
          compareNullableNumberAsc(left.active_backs, right.active_backs) ||
          compareStringAsc(left.roll_no, right.roll_no)
        );
      });

      return {
        semester_no,
        students: students.map((student, index) => ({
          student_id: student.student_id,
          score: student.score,
          rank: index + 1
        })),
        total_students: students.length
      };
    })
    .sort((left, right) => right.semester_no - left.semester_no);
}

async function getMetricRanking(
  studentId: number,
  scopedStudents: ScopedStudent[],
  metric: RankingMetricConfig,
  suffix: string
) {
  const rows = buildRankedCandidates(scopedStudents, metric);
  const selfRow = rows.find((row) => row.student_id === studentId) ?? null;
  const totalStudents = rows.length;

  return {
    key: metric.key,
    label: metric.label,
    score_label: metric.scoreLabel,
    self_rank: selfRow?.rank ?? null,
    self_score: selfRow ? formatScore(formatMetric(selfRow.score) ?? "0.00", suffix) : null,
    total_students: totalStudents,
    percentile: computePercentile(selfRow?.rank ?? null, totalStudents)
  } satisfies RankingMetric;
}

async function getCachedSemesterRankings(student: AnchorStudent, scope: RankingScopeConfig) {
  const sql = getSql();
  const rows = (await sql`
    SELECT
      semester_no,
      score::text AS score,
      rank,
      total_students
    FROM student_rankings
    WHERE student_id = ${student.id}
      AND scope_key = ${scope.key}
      AND metric_key = 'semester_sgpa'
      AND semester_no > 0
    ORDER BY semester_no DESC
  `) as Array<{
    semester_no: number;
    score: string;
    rank: number;
    total_students: number;
  }>;

  if (rows.length === 0) return null;

  return rows.map((row) => ({
    semester_no: row.semester_no,
    label: `Semester ${row.semester_no}`,
    score_label: "SGPA",
    self_rank: row.rank,
    self_score: row.score,
    total_students: row.total_students,
    percentile: computePercentile(row.rank, row.total_students)
  })) satisfies SemesterRankingMetric[];
}

function getSemesterRankings(
  studentId: number,
  scopeRows: ScopeDatasetRow[]
) {
  const semesterGroups = buildSemesterRankedCandidates(scopeRows);
  const semesterRankings: SemesterRankingMetric[] = [];

  for (const group of semesterGroups) {
    const selfRow = group.students.find((student) => student.student_id === studentId) ?? null;
    if (!selfRow) continue;

    semesterRankings.push({
        semester_no: group.semester_no,
        label: `Semester ${group.semester_no}`,
        score_label: "SGPA",
        self_rank: selfRow.rank,
        self_score: formatMetric(selfRow.score),
        total_students: group.total_students,
        percentile: computePercentile(selfRow.rank, group.total_students)
      });
  }

  return semesterRankings;
}

async function getScopeRankings(student: AnchorStudent, scope: RankingScopeConfig) {
  const cachedMetricResults = await Promise.all(
    RANKING_METRICS.map((metric) => getCachedMetricRanking(student, scope, metric))
  );
  const cachedSemesterMetrics = await getCachedSemesterRankings(student, scope);
  const hasFullCache = cachedMetricResults.every((metric) => metric !== null);
  const hasSemesterCache = cachedSemesterMetrics !== null;
  const useCache = hasFullCache && hasSemesterCache;
  const metricResults = useCache
    ? (cachedMetricResults as RankingMetric[])
    : [];
  const semesterMetrics = useCache ? cachedSemesterMetrics : [];
  const resolved = useCache
    ? { metricResults, semesterMetrics }
    : await (async () => {
        const scopeRows = await getScopeDataset(student, scope);
        const scopedStudents = buildScopedStudents(scopeRows);
        return {
          metricResults: await Promise.all(
            RANKING_METRICS.map((metric) =>
              getMetricRanking(student.id, scopedStudents, metric, metric.suffix)
            )
          ),
          semesterMetrics: getSemesterRankings(student.id, scopeRows)
        };
      })();
  const totalStudents =
    resolved.metricResults.find((metric) => metric.total_students > 0)?.total_students ?? 0;

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
      percentage: resolved.metricResults.find((metric) => metric.key === "percentage")!,
      cgpa: resolved.metricResults.find((metric) => metric.key === "cgpa")!,
      latest: resolved.metricResults.find((metric) => metric.key === "latest")!
    },
    semester_metrics: resolved.semesterMetrics
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
