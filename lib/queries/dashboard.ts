import "server-only";

import { getSql } from "@/lib/db";

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
    subjects: Array<{
      id: number;
      code: string | null;
      name: string | null;
      internal_marks: number | null;
      external_marks: number | null;
      total_marks: number | null;
      grade: string | null;
      back_paper: string | null;
    }>;
  }>;
};

type MetricRow = {
  latest_sgpa: string | null;
  overall_percentage: string | null;
  active_backs: number;
  cleared_backs: number;
};

type SemesterRow = Omit<DashboardPayload["semesters"][number], "subjects">;

type SubjectRow = DashboardPayload["semesters"][number]["subjects"][number] & {
  semester_result_id: number;
};

function parseNumericValue(value: string | null) {
  if (value === null) return null;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toFixedMetric(value: number | null) {
  return value === null ? null : value.toFixed(2);
}

export async function getDashboardForStudent(studentId: number): Promise<DashboardPayload | null> {
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

    const entry = subjectsBySemester.get(subject.semester_result_id) ?? [];
    entry.push({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      internal_marks: subject.internal_marks,
      external_marks: subject.external_marks,
      total_marks: subject.total_marks,
      grade: subject.grade,
      back_paper: subject.back_paper
    });
    subjectsBySemester.set(subject.semester_result_id, entry);
  }

  const latestSgpa =
    parseNumericValue(metricRows[0]?.latest_sgpa ?? null) ??
    parseNumericValue(semesters[0]?.sgpa ?? null);
  const cgpaValues = semesters
    .map((semester) => parseNumericValue(semester.sgpa))
    .filter((value): value is number => value !== null);
  const cgpa =
    cgpaValues.length === 0
      ? null
      : cgpaValues.reduce((sum, value) => sum + value, 0) / cgpaValues.length;

  return {
    student,
    metrics: {
      latest_sgpa: toFixedMetric(latestSgpa),
      cgpa: toFixedMetric(cgpa),
      overall_percentage: metricRows[0]?.overall_percentage ?? null,
      active_backs: metricRows[0]?.active_backs ?? 0,
      cleared_backs: metricRows[0]?.cleared_backs ?? 0
    },
    semesters: semesters.map((semester) => ({
      ...semester,
      subjects: subjectsBySemester.get(semester.id) ?? []
    }))
  };
}
