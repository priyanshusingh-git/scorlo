import "server-only";

import { computeAktuWeightedCgpa, formatMetric, parseNumericMetric } from "@/lib/aktu-metrics";
import { getSql } from "@/lib/db";
import type { RankingMetricKey, RankingsPayload } from "@/lib/queries/rankings";
import { getRankingsForStudent } from "@/lib/queries/rankings";

export type DashboardMetricTile = {
  label: string;
  value: string;
  hint: string;
  tone: "accent" | "success" | "warning" | "danger";
};

export type DashboardProgressPoint = {
  semester: string;
  value: number;
};

export type DashboardProgressChart = {
  points: DashboardProgressPoint[];
  peak_label: string;
  path: string;
  fill_path: string;
  coordinates: Array<{
    semester: string;
    x: number;
    y: number;
  }>;
};

export type DashboardPayload = {
  student: {
    id: number;
    roll_no: string;
    name: string | null;
    branch_name: string | null;
    course_name: string | null;
    institute_name: string | null;
  };
  metrics: {
    latest_sgpa: string | null;
    cgpa: string | null;
    overall_percentage: string | null;
    active_backs: number;
    cleared_backs: number;
  };
  semesters: Array<{
    id: number;
    semester_no: number;
    result_status: string | null;
    sgpa: string | null;
    total_marks_obtained: number | null;
    date_of_declaration: string | null;
    session_id: string | null;
    session_type: string | null;
    marks_maximum: number | null;
    cop_subjects: string[];
    formatted_declaration_date: string;
    status_badge_label: string;
    status_badge_tone: "warning" | "accent" | "success";
    subjects: Array<{
      id: number;
      code: string | null;
      name: string | null;
      internal_marks: number | null;
      external_marks: number | null;
      total_marks: number | null;
      grade: string | null;
      back_paper: string | null;
      status_label: string;
      status_class_name: string;
    }>;
  }>;
};

export type StudentAppSnapshot = {
  dashboard: DashboardPayload;
  home_view: {
    hero: {
      summary: string;
      status: string;
      latest_signal_label: string;
      latest_signal_value: string;
      latest_signal_hint: string;
    };
    metric_tiles: DashboardMetricTile[];
    progress_chart: DashboardProgressChart;
    standing: {
      trend_note: string;
      best_semester_label: string;
      latest_status_label: string;
      latest_result_label: string;
      active_backs_tone: "success" | "warning";
      active_backs_label: string;
      cleared_backs_label: string;
    };
  };
  results_view: {
    latest_declaration: string;
    latest_semester_label: string;
    latest_status: string;
    best_semester_label: string;
  };
  rankings: RankingsPayload | null;
  /** Internal cache version — bump SNAPSHOT_VERSION when snapshot shape changes */
  _v?: number;
};

type MetricRow = {
  latest_sgpa: string | null;
  overall_percentage: string | null;
  active_backs: number;
  cleared_backs: number;
};

type SemesterRow = Omit<DashboardPayload["semesters"][number], "subjects" | "formatted_declaration_date" | "status_badge_label" | "status_badge_tone">;

type SubjectRow = Omit<DashboardPayload["semesters"][number]["subjects"][number], "status_label" | "status_class_name"> & {
  semester_result_id: number;
};

type CacheRow = {
  payload_json: StudentAppSnapshot | DashboardPayload | string;
  updated_at: string;
};

/**
 * Bump this version whenever the shape of `StudentAppSnapshot` changes.
 * Cached blobs that don't match will be treated as a cache miss and rebuilt.
 */
const SNAPSHOT_VERSION = 4;

let cacheSchemaPromise: Promise<void> | null = null;

async function ensureSnapshotCacheTable() {
  if (!cacheSchemaPromise) {
    cacheSchemaPromise = (async () => {
      const sql = getSql();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS student_app_snapshot_cache (
          student_id BIGINT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
          payload_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sql.query(`
        CREATE INDEX IF NOT EXISTS ix_student_app_snapshot_cache_updated_at
          ON student_app_snapshot_cache(updated_at DESC)
      `);
    })().catch((error) => {
      cacheSchemaPromise = null;
      throw error;
    });
  }

  await cacheSchemaPromise;
}

function parseNumericValue(value: string | null) {
  if (value === null) return null;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDeclarationDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function normalizeGrade(grade: string | null | undefined) {
  return (grade ?? "").trim().toUpperCase();
}

function getGraceSubjectCodes(subjects: Array<{ code: string | null; grade: string | null }>) {
  return new Set(
    subjects
      .filter((subject) => normalizeGrade(subject.grade) === "E#" && subject.code)
      .map((subject) => subject.code!.toUpperCase())
  );
}

function getEffectiveCarrySubjects(
  copSubjects: string[],
  subjects: Array<{ code: string | null; grade: string | null }>
) {
  const graceSubjectCodes = getGraceSubjectCodes(subjects);

  return copSubjects.filter((code) => !graceSubjectCodes.has(code.trim().toUpperCase()));
}

function getSubjectStatus(subject: SubjectRow, copSubjects: string[]) {
  const grade = normalizeGrade(subject.grade);

  if (grade === "E#") {
    return {
      label: "Grace clear",
      className: "text-success"
    };
  }

  const isCarryPaper =
    (subject.code !== null && copSubjects.includes(subject.code)) ||
    grade === "F" ||
    grade === "AB" ||
    grade === "ABSENT";

  if (isCarryPaper) {
    return {
      label: "Carry paper",
      className: "text-danger"
    };
  }

  if (grade === "WH" || grade === "UFM") {
    return {
      label: "Review",
      className: "text-warning"
    };
  }

  return {
    label: "Cleared",
    className: "text-success"
  };
}

function getSemesterStatus(semester: {
  result_status: string | null;
  cop_subjects: string[];
  subjects: Array<{ code: string | null; grade: string | null }>;
}) {
  const activeCarryCount = getEffectiveCarrySubjects(semester.cop_subjects, semester.subjects).length;
  const hasGraceClear = semester.subjects.some((subject) => {
    return normalizeGrade(subject.grade) === "E#";
  });
  const rawStatus = (semester.result_status ?? "").trim().toUpperCase();

  if (activeCarryCount > 0) {
    return {
      label: `CP(${activeCarryCount})`,
      tone: "warning" as const
    };
  }

  if (hasGraceClear) {
    return {
      label: "PWG",
      tone: "accent" as const
    };
  }

  if (rawStatus.includes("PASS")) {
    return {
      label: "Cleared",
      tone: "success" as const
    };
  }

  if (rawStatus.includes("CP") || rawStatus.includes("PWG")) {
    return {
      label: "Cleared",
      tone: "success" as const
    };
  }

  return {
    label: semester.result_status ?? "Unknown",
    tone: "accent" as const
  };
}

function buildMetricTiles(dashboard: DashboardPayload): DashboardMetricTile[] {
  const semesterCount = dashboard.semesters.length;

  return [
    {
      label: "CGPA",
      value: dashboard.metrics.cgpa ?? "--",
      hint:
        semesterCount > 0
          ? `AKTU credit-weighted across ${semesterCount} semester${semesterCount === 1 ? "" : "s"}`
          : "Waiting for semester SGPA records",
      tone: "accent"
    },
    {
      label: "Overall %",
      value: dashboard.metrics.overall_percentage ?? "--",
      hint: "Combined academic aggregate based on available results",
      tone: "warning"
    },
    {
      label: "Latest SGPA",
      value: dashboard.metrics.latest_sgpa ?? "--",
      hint:
        dashboard.semesters[0] !== undefined
          ? `Semester ${dashboard.semesters[0].semester_no} result`
          : "No semester result found yet",
      tone: "success"
    },
    {
      label: "Active backs",
      value: String(dashboard.metrics.active_backs),
      hint:
        dashboard.metrics.active_backs === 0
          ? "No current carry papers"
          : "Open carry papers in the latest record",
      tone: "danger"
    }
  ];
}

function buildProgressPoints(dashboard: DashboardPayload): DashboardProgressPoint[] {
  return dashboard.semesters
    .slice()
    .sort((left, right) => left.semester_no - right.semester_no)
    .map((semester) => ({
      semester: `Sem ${semester.semester_no}`,
      value: parseNumericValue(semester.sgpa) ?? 0
    }))
    .filter((point) => point.value > 0);
}

function buildProgressChart(points: DashboardProgressPoint[]): DashboardProgressChart {
  if (points.length === 0) {
    return {
      points: [],
      peak_label: "--",
      path: "",
      fill_path: "",
      coordinates: []
    };
  }

  const max = Math.max(...points.map((point) => point.value));
  const min = Math.min(...points.map((point) => point.value));
  const chartStart = 28;
  const chartEnd = 300;
  const step = points.length === 1 ? 0 : (chartEnd - chartStart) / (points.length - 1);

  const coordinates = points.map((point, index) => {
    const x = chartStart + index * step;
    const range = max - min || 1;
    const normalized = (point.value - min) / range;
    const y = 122 - normalized * 62;
    return { semester: point.semester, x, y };
  });

  const path = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return {
    points,
    peak_label: max.toFixed(2),
    path,
    fill_path: `${path} L ${chartEnd} 132 L ${chartStart} 132 Z`,
    coordinates
  };
}

function getBestSemester(dashboard: DashboardPayload) {
  return dashboard.semesters.reduce<DashboardPayload["semesters"][number] | null>((best, semester) => {
    const current = parseNumericValue(semester.sgpa);
    const bestValue = parseNumericValue(best?.sgpa ?? null);

    if (current === null) return best;
    if (bestValue === null || current > bestValue) return semester;
    return best;
  }, null);
}

function getTrendNote(dashboard: DashboardPayload) {
  const points = buildProgressPoints(dashboard);
  if (points.length < 2) {
    return "More semester records are needed before a trend can be inferred.";
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const delta = last - first;

  if (delta >= 0.25) {
    return "The latest SGPA is meaningfully above the first recorded semester.";
  }

  if (delta <= -0.25) {
    return "The latest SGPA sits below the early baseline and needs recovery.";
  }

  return "The SGPA band is mostly steady across the recorded semesters.";
}

function buildHeroView(dashboard: DashboardPayload) {
  const latestSemester = dashboard.semesters[0];
  const activeBacks = dashboard.metrics.active_backs;

  if (dashboard.metrics.overall_percentage) {
    return {
      summary: dashboard.student.institute_name
        ? `${dashboard.student.course_name ?? "AKTU record"} at ${dashboard.student.institute_name}.`
        : "Academic record synced from Neon.",
      latest_signal_label: "Overall percentage",
      latest_signal_value: dashboard.metrics.overall_percentage,
      latest_signal_hint: "Academic aggregate derived from all available results",
      status:
        activeBacks === 0
          ? "No active backs"
          : `${activeBacks} active back${activeBacks === 1 ? "" : "s"}`
    };
  }

  return {
    summary: dashboard.student.institute_name
      ? `${dashboard.student.course_name ?? "AKTU record"} at ${dashboard.student.institute_name}.`
      : "Academic record synced from Neon.",
    latest_signal_label: "Latest SGPA",
    latest_signal_value: dashboard.metrics.latest_sgpa ?? "--",
    latest_signal_hint: latestSemester
      ? `From Semester ${latestSemester.semester_no}`
      : "Waiting for semester records",
    status:
      activeBacks === 0
        ? "No active backs"
        : `${activeBacks} active back${activeBacks === 1 ? "" : "s"}`
  };
}

function buildResultsSummary(dashboard: DashboardPayload) {
  const latestSemester = dashboard.semesters[0];
  const bestSemester = getBestSemester(dashboard);

  return {
    latest_declaration: latestSemester?.date_of_declaration ?? "Declaration date unavailable",
    latest_semester_label: latestSemester ? `Semester ${latestSemester.semester_no}` : "No semester",
    latest_status: latestSemester?.result_status ?? "Unknown",
    best_semester_label: bestSemester ? `Semester ${bestSemester.semester_no}` : "Not available"
  };
}

async function readSnapshotCache(studentId: number) {
  await ensureSnapshotCacheTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      payload_json,
      updated_at::text
    FROM student_app_snapshot_cache
    WHERE student_id = ${studentId}
    LIMIT 1
  `) as CacheRow[];

  const row = rows[0] ?? null;
  if (!row) return null;

  const payload =
    typeof row.payload_json === "string"
      ? (JSON.parse(row.payload_json) as StudentAppSnapshot | DashboardPayload)
      : row.payload_json;

  if (
    payload &&
    typeof payload === "object" &&
    "dashboard" in payload &&
    "home_view" in payload &&
    "results_view" in payload &&
    "rankings" in payload &&
    (payload as StudentAppSnapshot)._v === SNAPSHOT_VERSION
  ) {
    return payload as StudentAppSnapshot;
  }

  return null;
}

async function writeSnapshotCache(studentId: number, payload: StudentAppSnapshot) {
  await ensureSnapshotCacheTable();
  const sql = getSql();
  const serialized = JSON.stringify({ ...payload, _v: SNAPSHOT_VERSION });

  await sql`
    INSERT INTO student_app_snapshot_cache (
      student_id,
      payload_json,
      updated_at
    )
    VALUES (
      ${studentId},
      ${serialized}::jsonb,
      NOW()
    )
    ON CONFLICT (student_id) DO UPDATE
      SET payload_json = EXCLUDED.payload_json,
          updated_at = NOW()
  `;
}

export async function countDashboardCacheRows() {
  await ensureSnapshotCacheTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM student_app_snapshot_cache
  `) as Array<{ total: number }>;

  return rows[0]?.total ?? 0;
}

export async function deleteDashboardCacheForStudent(studentId: number) {
  await ensureSnapshotCacheTable();
  const sql = getSql();
  await sql`
    DELETE FROM student_app_snapshot_cache
    WHERE student_id = ${studentId}
  `;
}

export async function clearAllDashboardCaches() {
  await ensureSnapshotCacheTable();
  const sql = getSql();
  await sql.query("TRUNCATE TABLE student_app_snapshot_cache");
}

async function buildDashboardDataForStudent(studentId: number): Promise<DashboardPayload | null> {
  const sql = getSql();
  const studentRows = (await sql`
    SELECT
      id,
      roll_no,
      name,
      branch_name,
      course_name,
      institute_name
    FROM students
    WHERE id = ${studentId}
    LIMIT 1
  `) as DashboardPayload["student"][];

  const student = studentRows[0] ?? null;
  if (!student) return null;

  const metricRows = (await sql`
    SELECT
      latest_sgpa::text,
      overall_percentage::text,
      active_backs,
      cleared_backs
    FROM student_metrics
    WHERE student_id = ${studentId}
    LIMIT 1
  `) as MetricRow[];

  const semesters = (await sql`
    WITH ranked_semesters AS (
      SELECT
        sr.id,
        sr.semester_no,
        sr.result_status,
        sr.sgpa::text,
        sr.total_marks_obtained,
        sr.date_of_declaration::text,
        rs.session_id,
        rs.session_type,
        rs.marks_maximum,
        rs.cop_subjects,
        ROW_NUMBER() OVER (
          PARTITION BY sr.semester_no
          ORDER BY
            rs.session_id DESC NULLS LAST,
            CASE WHEN UPPER(COALESCE(rs.session_type, '')) = 'BACK' THEN 1 ELSE 0 END DESC,
            sr.date_of_declaration DESC NULLS LAST,
            sr.id DESC
        ) AS row_no
      FROM semester_results sr
      JOIN result_sessions rs ON rs.id = sr.result_session_id
      WHERE rs.student_id = ${studentId}
    )
    SELECT
      id,
      semester_no,
      result_status,
      sgpa,
      total_marks_obtained,
      date_of_declaration,
      session_id,
      session_type,
      marks_maximum,
      cop_subjects
    FROM ranked_semesters
    WHERE row_no = 1
    ORDER BY semester_no DESC
  `) as SemesterRow[];

  const semesterIds = new Set(semesters.map((semester) => semester.id));
  const subjectRows = (semesterIds.size === 0
    ? []
    : ((await sql`
      SELECT
        sub.semester_result_id,
        sub.id,
        sub.code,
        sub.name,
        sub.internal_marks,
        sub.external_marks,
        sub.total_marks,
        sub.grade,
        sub.back_paper
      FROM subject_results sub
      JOIN semester_results sr ON sr.id = sub.semester_result_id
      JOIN result_sessions rs ON rs.id = sr.result_session_id
      WHERE rs.student_id = ${studentId}
      ORDER BY sub.semester_result_id DESC, sub.code ASC
    `) as SubjectRow[]));

  const subjectsBySemester = new Map<number, DashboardPayload["semesters"][number]["subjects"]>();
  for (const subject of subjectRows) {
    if (!semesterIds.has(subject.semester_result_id)) continue;

    const semester = semesters.find((entry) => entry.id === subject.semester_result_id);
    const effectiveCarrySubjects = getEffectiveCarrySubjects(
      semester?.cop_subjects ?? [],
      subjectRows
        .filter((entry) => entry.semester_result_id === subject.semester_result_id)
        .map((entry) => ({ code: entry.code, grade: entry.grade }))
    );
    const subjectStatus = getSubjectStatus(subject, effectiveCarrySubjects);
    const entry = subjectsBySemester.get(subject.semester_result_id) ?? [];
    entry.push({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      internal_marks: subject.internal_marks,
      external_marks: subject.external_marks,
      total_marks: subject.total_marks,
      grade: subject.grade,
      back_paper: subject.back_paper,
      status_label: subjectStatus.label,
      status_class_name: subjectStatus.className
    });
    subjectsBySemester.set(subject.semester_result_id, entry);
  }

  const latestSgpa =
    parseNumericMetric(metricRows[0]?.latest_sgpa ?? null) ??
    parseNumericMetric(semesters[0]?.sgpa ?? null);
  const cgpa = computeAktuWeightedCgpa(semesters);

  const enrichedSemesters = semesters.map((semester) => {
    const subjects = subjectsBySemester.get(semester.id) ?? [];
    const semesterStatus = getSemesterStatus({
      result_status: semester.result_status,
      cop_subjects: semester.cop_subjects,
      subjects
    });

    return {
      ...semester,
      formatted_declaration_date: formatDeclarationDate(semester.date_of_declaration),
      status_badge_label: semesterStatus.label,
      status_badge_tone: semesterStatus.tone,
      subjects
    };
  });

  return {
    student,
    metrics: {
      latest_sgpa: formatMetric(latestSgpa),
      cgpa: formatMetric(cgpa),
      overall_percentage: metricRows[0]?.overall_percentage ?? null,
      active_backs: metricRows[0]?.active_backs ?? 0,
      cleared_backs: metricRows[0]?.cleared_backs ?? 0
    },
    semesters: enrichedSemesters
  };
}

function buildHomeView(dashboard: DashboardPayload) {
  const progressPoints = buildProgressPoints(dashboard);
  const bestSemester = getBestSemester(dashboard);
  const latestSemester = dashboard.semesters[0] ?? null;
  const hero = buildHeroView(dashboard);

  return {
    hero,
    metric_tiles: buildMetricTiles(dashboard),
    progress_chart: buildProgressChart(progressPoints),
    standing: {
      trend_note: getTrendNote(dashboard),
      best_semester_label: bestSemester ? `Semester ${bestSemester.semester_no}` : "Not available",
      latest_status_label: latestSemester?.result_status ?? "Unknown",
      latest_result_label: latestSemester
        ? `Latest result: Semester ${latestSemester.semester_no}`
        : "No semester result yet",
      active_backs_tone: dashboard.metrics.active_backs === 0 ? ("success" as const) : ("warning" as const),
      active_backs_label: `Active backs: ${dashboard.metrics.active_backs}`,
      cleared_backs_label: `Cleared backs: ${dashboard.metrics.cleared_backs}`
    }
  };
}

async function buildStudentAppSnapshot(studentId: number): Promise<StudentAppSnapshot | null> {
  const dashboard = await buildDashboardDataForStudent(studentId);
  if (!dashboard) return null;

  return {
    dashboard,
    home_view: buildHomeView(dashboard),
    results_view: buildResultsSummary(dashboard),
    rankings: await getRankingsForStudent(studentId)
  };
}

export async function rebuildDashboardCacheForStudent(studentId: number) {
  const payload = await buildStudentAppSnapshot(studentId);

  if (!payload) {
    await deleteDashboardCacheForStudent(studentId);
    return null;
  }

  await writeSnapshotCache(studentId, payload);
  return payload;
}

export async function rebuildDashboardCachesForLinkedStudents() {
  await ensureSnapshotCacheTable();
  const sql = getSql();
  const linkedRows = (await sql`
    SELECT DISTINCT student_id::int AS student_id
    FROM student_links
    WHERE status = 'linked'
      AND student_id IS NOT NULL
    ORDER BY student_id ASC
  `) as Array<{ student_id: number }>;

  await clearAllDashboardCaches();

  let rebuilt = 0;
  for (const row of linkedRows) {
    const payload = await rebuildDashboardCacheForStudent(row.student_id);
    if (payload) rebuilt += 1;
  }

  return {
    rebuiltStudents: rebuilt,
    linkedStudents: linkedRows.length
  };
}

export async function getStudentAppSnapshot(studentId: number): Promise<StudentAppSnapshot | null> {
  const cached = await readSnapshotCache(studentId);
  if (cached) {
    return cached;
  }

  return rebuildDashboardCacheForStudent(studentId);
}

export async function getDashboardForStudent(studentId: number): Promise<DashboardPayload | null> {
  const snapshot = await getStudentAppSnapshot(studentId);
  return snapshot?.dashboard ?? null;
}

export async function getRankingsSnapshotForStudent(studentId: number): Promise<RankingsPayload | null> {
  const snapshot = await getStudentAppSnapshot(studentId);
  return snapshot?.rankings ?? null;
}
