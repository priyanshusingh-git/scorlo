import "server-only";

import { getSql } from "@/lib/db";
import type {
  AdminStudentExportDetailSheet,
  AdminStudentExportRange,
  AdminStudentExportSheet
} from "@/lib/admin/student-export";

export type AdminStudentExportStudentRow = {
  student_id: number;
  roll_no: string;
  enrollment_no: string | null;
  name: string | null;
  father_name: string | null;
  mother_name: string | null;
  gender: string | null;
  institute_code: string | null;
  institute_name: string | null;
  course_code: string | null;
  course_name: string | null;
  branch_code: string | null;
  branch_name: string | null;
  passing_year: number | null;
  cgpa: string | null;
  overall_percentage: string | null;
  latest_sgpa: string | null;
  active_backs: number;
  cleared_backs: number;
  linked_email: string | null;
  linked_status: string | null;
  linked_dob: string | null;
  batch_percentage_rank: number | null;
  batch_cgpa_rank: number | null;
  branch_percentage_rank: number | null;
  branch_cgpa_rank: number | null;
};

export type AdminStudentExportSemesterRow = {
  student_id: number;
  roll_no: string;
  student_name: string | null;
  semester_no: number;
  result_status: string | null;
  sgpa: string | null;
  total_marks_obtained: number | null;
  marks_maximum: number | null;
  session_id: string | null;
  session_type: string | null;
  date_of_declaration: string | null;
  branch_rank: number | null;
  batch_rank: number | null;
};

export type AdminStudentExportSubjectRow = {
  student_id: number;
  roll_no: string;
  student_name: string | null;
  semester_no: number;
  subject_code: string | null;
  subject_name: string | null;
  subject_type: string | null;
  internal_marks: number | null;
  external_marks: number | null;
  total_marks: number | null;
  grade: string | null;
  back_paper: string | null;
};

export type AdminStudentExportDataset = {
  students: AdminStudentExportStudentRow[];
  semesters: AdminStudentExportSemesterRow[];
  subjects: AdminStudentExportSubjectRow[];
};

function buildSearchPattern(query: string | undefined) {
  const trimmed = query?.trim() ?? "";
  return {
    enabled: trimmed.length > 0,
    value: trimmed ? `%${trimmed}%` : ""
  };
}

function sanitizePositiveInteger(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function toSqlIntegerList(values: number[]) {
  const normalized = values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  return normalized.length > 0 ? normalized.join(", ") : null;
}

async function getStudentSummaryRows({
  query,
  branch,
  scopedBranch,
  course,
  range,
  page,
  pageSize,
  studentId
}: {
  query?: string;
  branch?: string;
  scopedBranch?: string | null;
  course?: string;
  range?: AdminStudentExportRange;
  page?: number;
  pageSize?: number;
  studentId?: number;
}) {
  const sql = getSql();
  const pattern = buildSearchPattern(query);
  const branchFilter = scopedBranch?.trim() || branch?.trim() || "";
  const courseFilter = course?.trim() ?? "";
  const normalizedPage = sanitizePositiveInteger(page, 1);
  const normalizedPageSize = Math.max(1, Math.min(100, Math.floor(pageSize ?? 10)));
  const offset = (normalizedPage - 1) * normalizedPageSize;
  const scopedStudentId =
    Number.isInteger(studentId) && Number(studentId) > 0 ? Number(studentId) : null;

  const selectQuery = scopedStudentId !== null
    ? sql`
        SELECT
          s.id::int AS student_id,
          s.roll_no,
          s.enrollment_no,
          s.name,
          s.father_name,
          s.mother_name,
          s.gender,
          s.institute_code,
          s.institute_name,
          s.course_code,
          s.course_name,
          s.branch_code,
          s.branch_name,
          s.passing_year::int,
          sm.cgpa::text,
          sm.overall_percentage::text,
          sm.latest_sgpa::text,
          COALESCE(sm.active_backs, 0)::int AS active_backs,
          COALESCE(sm.cleared_backs, 0)::int AS cleared_backs,
          au.email AS linked_email,
          sl.status AS linked_status,
          sl.dob AS linked_dob,
          batch_percentage.rank::int AS batch_percentage_rank,
          batch_cgpa.rank::int AS batch_cgpa_rank,
          branch_percentage.rank::int AS branch_percentage_rank,
          branch_cgpa.rank::int AS branch_cgpa_rank
        FROM students s
        LEFT JOIN student_metrics sm ON sm.student_id = s.id
        LEFT JOIN student_links sl ON sl.student_id = s.id
        LEFT JOIN app_users au ON au.id = sl.app_user_id
        LEFT JOIN student_rankings batch_percentage
          ON batch_percentage.student_id = s.id
         AND batch_percentage.scope_key = 'batch'
         AND batch_percentage.metric_key = 'percentage'
         AND batch_percentage.semester_no = 0
        LEFT JOIN student_rankings batch_cgpa
          ON batch_cgpa.student_id = s.id
         AND batch_cgpa.scope_key = 'batch'
         AND batch_cgpa.metric_key = 'cgpa'
         AND batch_cgpa.semester_no = 0
        LEFT JOIN student_rankings branch_percentage
          ON branch_percentage.student_id = s.id
         AND branch_percentage.scope_key = 'branch'
         AND branch_percentage.metric_key = 'percentage'
         AND branch_percentage.semester_no = 0
        LEFT JOIN student_rankings branch_cgpa
          ON branch_cgpa.student_id = s.id
         AND branch_cgpa.scope_key = 'branch'
         AND branch_cgpa.metric_key = 'cgpa'
         AND branch_cgpa.semester_no = 0
        WHERE s.id = ${scopedStudentId}
          AND (
            ${!pattern.enabled}
            OR s.roll_no ILIKE ${pattern.value}
            OR COALESCE(s.name, '') ILIKE ${pattern.value}
            OR COALESCE(s.institute_name, '') ILIKE ${pattern.value}
          )
          AND (${branchFilter} = '' OR COALESCE(s.branch_name, '') = ${branchFilter})
          AND (${courseFilter} = '' OR COALESCE(s.course_name, '') = ${courseFilter})
        ORDER BY branch_percentage.rank ASC NULLS LAST, batch_percentage.rank ASC NULLS LAST, s.roll_no ASC
      `
    : range === "current_page"
      ? sql`
          SELECT
            s.id::int AS student_id,
            s.roll_no,
            s.enrollment_no,
            s.name,
            s.father_name,
            s.mother_name,
            s.gender,
            s.institute_code,
            s.institute_name,
            s.course_code,
            s.course_name,
            s.branch_code,
            s.branch_name,
            s.passing_year::int,
            sm.cgpa::text,
            sm.overall_percentage::text,
            sm.latest_sgpa::text,
            COALESCE(sm.active_backs, 0)::int AS active_backs,
            COALESCE(sm.cleared_backs, 0)::int AS cleared_backs,
            au.email AS linked_email,
            sl.status AS linked_status,
            sl.dob AS linked_dob,
            batch_percentage.rank::int AS batch_percentage_rank,
            batch_cgpa.rank::int AS batch_cgpa_rank,
            branch_percentage.rank::int AS branch_percentage_rank,
            branch_cgpa.rank::int AS branch_cgpa_rank
          FROM students s
          LEFT JOIN student_metrics sm ON sm.student_id = s.id
          LEFT JOIN student_links sl ON sl.student_id = s.id
          LEFT JOIN app_users au ON au.id = sl.app_user_id
          LEFT JOIN student_rankings batch_percentage
            ON batch_percentage.student_id = s.id
           AND batch_percentage.scope_key = 'batch'
           AND batch_percentage.metric_key = 'percentage'
           AND batch_percentage.semester_no = 0
          LEFT JOIN student_rankings batch_cgpa
            ON batch_cgpa.student_id = s.id
           AND batch_cgpa.scope_key = 'batch'
           AND batch_cgpa.metric_key = 'cgpa'
           AND batch_cgpa.semester_no = 0
          LEFT JOIN student_rankings branch_percentage
            ON branch_percentage.student_id = s.id
           AND branch_percentage.scope_key = 'branch'
           AND branch_percentage.metric_key = 'percentage'
           AND branch_percentage.semester_no = 0
          LEFT JOIN student_rankings branch_cgpa
            ON branch_cgpa.student_id = s.id
           AND branch_cgpa.scope_key = 'branch'
           AND branch_cgpa.metric_key = 'cgpa'
           AND branch_cgpa.semester_no = 0
          WHERE (
            ${!pattern.enabled}
            OR s.roll_no ILIKE ${pattern.value}
            OR COALESCE(s.name, '') ILIKE ${pattern.value}
            OR COALESCE(s.institute_name, '') ILIKE ${pattern.value}
          )
            AND (${branchFilter} = '' OR COALESCE(s.branch_name, '') = ${branchFilter})
            AND (${courseFilter} = '' OR COALESCE(s.course_name, '') = ${courseFilter})
          ORDER BY branch_percentage.rank ASC NULLS LAST, batch_percentage.rank ASC NULLS LAST, s.roll_no ASC
          LIMIT ${normalizedPageSize}
          OFFSET ${offset}
        `
      : sql`
          SELECT
            s.id::int AS student_id,
            s.roll_no,
            s.enrollment_no,
            s.name,
            s.father_name,
            s.mother_name,
            s.gender,
            s.institute_code,
            s.institute_name,
            s.course_code,
            s.course_name,
            s.branch_code,
            s.branch_name,
            s.passing_year::int,
            sm.cgpa::text,
            sm.overall_percentage::text,
            sm.latest_sgpa::text,
            COALESCE(sm.active_backs, 0)::int AS active_backs,
            COALESCE(sm.cleared_backs, 0)::int AS cleared_backs,
            au.email AS linked_email,
            sl.status AS linked_status,
            sl.dob AS linked_dob,
            batch_percentage.rank::int AS batch_percentage_rank,
            batch_cgpa.rank::int AS batch_cgpa_rank,
            branch_percentage.rank::int AS branch_percentage_rank,
            branch_cgpa.rank::int AS branch_cgpa_rank
          FROM students s
          LEFT JOIN student_metrics sm ON sm.student_id = s.id
          LEFT JOIN student_links sl ON sl.student_id = s.id
          LEFT JOIN app_users au ON au.id = sl.app_user_id
          LEFT JOIN student_rankings batch_percentage
            ON batch_percentage.student_id = s.id
           AND batch_percentage.scope_key = 'batch'
           AND batch_percentage.metric_key = 'percentage'
           AND batch_percentage.semester_no = 0
          LEFT JOIN student_rankings batch_cgpa
            ON batch_cgpa.student_id = s.id
           AND batch_cgpa.scope_key = 'batch'
           AND batch_cgpa.metric_key = 'cgpa'
           AND batch_cgpa.semester_no = 0
          LEFT JOIN student_rankings branch_percentage
            ON branch_percentage.student_id = s.id
           AND branch_percentage.scope_key = 'branch'
           AND branch_percentage.metric_key = 'percentage'
           AND branch_percentage.semester_no = 0
          LEFT JOIN student_rankings branch_cgpa
            ON branch_cgpa.student_id = s.id
           AND branch_cgpa.scope_key = 'branch'
           AND branch_cgpa.metric_key = 'cgpa'
           AND branch_cgpa.semester_no = 0
          WHERE (
            ${!pattern.enabled}
            OR s.roll_no ILIKE ${pattern.value}
            OR COALESCE(s.name, '') ILIKE ${pattern.value}
            OR COALESCE(s.institute_name, '') ILIKE ${pattern.value}
          )
            AND (${branchFilter} = '' OR COALESCE(s.branch_name, '') = ${branchFilter})
            AND (${courseFilter} = '' OR COALESCE(s.course_name, '') = ${courseFilter})
          ORDER BY branch_percentage.rank ASC NULLS LAST, batch_percentage.rank ASC NULLS LAST, s.roll_no ASC
        `;

  return (await selectQuery) as AdminStudentExportStudentRow[];
}

async function getSemesterRows(studentIds: number[]) {
  const sql = getSql();
  const idList = toSqlIntegerList(studentIds);

  if (!idList) {
    return [] satisfies AdminStudentExportSemesterRow[];
  }

  const rows = (await sql.query(`
    WITH export_students AS (
      SELECT
        s.id AS student_id,
        s.roll_no,
        s.name
      FROM students s
      WHERE s.id IN (${idList})
    ),
    ranked_semesters AS (
      SELECT
        rs.student_id,
        es.roll_no,
        es.name AS student_name,
        sr.id AS semester_result_id,
        sr.semester_no,
        sr.result_status,
        sr.sgpa::text AS sgpa,
        sr.total_marks_obtained,
        sr.date_of_declaration::text AS date_of_declaration,
        rs.session_id,
        rs.session_type,
        rs.marks_maximum,
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
      JOIN export_students es ON es.student_id = rs.student_id
    )
    SELECT
      ranked_semesters.student_id::int AS student_id,
      ranked_semesters.roll_no,
      ranked_semesters.student_name,
      ranked_semesters.semester_no::int AS semester_no,
      ranked_semesters.result_status,
      ranked_semesters.sgpa,
      ranked_semesters.total_marks_obtained::int,
      ranked_semesters.marks_maximum::int,
      ranked_semesters.session_id,
      ranked_semesters.session_type,
      ranked_semesters.date_of_declaration,
      branch_rank.rank::int AS branch_rank,
      batch_rank.rank::int AS batch_rank
    FROM ranked_semesters
    LEFT JOIN student_rankings branch_rank
      ON branch_rank.student_id = ranked_semesters.student_id
     AND branch_rank.scope_key = 'branch'
     AND branch_rank.metric_key = 'semester_sgpa'
     AND branch_rank.semester_no = ranked_semesters.semester_no
    LEFT JOIN student_rankings batch_rank
      ON batch_rank.student_id = ranked_semesters.student_id
     AND batch_rank.scope_key = 'batch'
     AND batch_rank.metric_key = 'semester_sgpa'
     AND batch_rank.semester_no = ranked_semesters.semester_no
    WHERE ranked_semesters.row_no = 1
    ORDER BY ranked_semesters.roll_no ASC, ranked_semesters.semester_no DESC
  `)) as AdminStudentExportSemesterRow[];

  return rows;
}

async function getSubjectRows(studentIds: number[]) {
  const sql = getSql();
  const idList = toSqlIntegerList(studentIds);

  if (!idList) {
    return [] satisfies AdminStudentExportSubjectRow[];
  }

  const rows = (await sql.query(`
    WITH export_students AS (
      SELECT
        s.id AS student_id,
        s.roll_no,
        s.name
      FROM students s
      WHERE s.id IN (${idList})
    ),
    ranked_semesters AS (
      SELECT
        rs.student_id,
        es.roll_no,
        es.name AS student_name,
        sr.id AS semester_result_id,
        sr.semester_no,
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
      JOIN export_students es ON es.student_id = rs.student_id
    )
    SELECT
      ranked_semesters.student_id::int AS student_id,
      ranked_semesters.roll_no,
      ranked_semesters.student_name,
      ranked_semesters.semester_no::int AS semester_no,
      sub.code AS subject_code,
      sub.name AS subject_name,
      sub.type AS subject_type,
      sub.internal_marks::int,
      sub.external_marks::int,
      sub.total_marks::int,
      sub.grade,
      sub.back_paper
    FROM ranked_semesters
    JOIN subject_results sub ON sub.semester_result_id = ranked_semesters.semester_result_id
    WHERE ranked_semesters.row_no = 1
    ORDER BY ranked_semesters.roll_no ASC, ranked_semesters.semester_no DESC, sub.code ASC NULLS LAST, sub.id ASC
  `)) as AdminStudentExportSubjectRow[];

  return rows;
}

export async function getAdminStudentExportDatasetForList({
  query,
  branch,
  scopedBranch,
  course,
  range,
  page,
  pageSize,
  selectedSheets
}: {
  query?: string;
  branch?: string;
  scopedBranch?: string | null;
  course?: string;
  range: AdminStudentExportRange;
  page?: number;
  pageSize?: number;
  selectedSheets: readonly AdminStudentExportSheet[];
}): Promise<AdminStudentExportDataset> {
  const students = await getStudentSummaryRows({
    query,
    branch,
    scopedBranch,
    course,
    range,
    page,
    pageSize
  });

  return buildDatasetFromStudents(students, selectedSheets);
}

export async function getAdminStudentExportDatasetForStudent({
  studentId,
  scopedBranch,
  selectedSheets
}: {
  studentId: number;
  scopedBranch?: string | null;
  selectedSheets: readonly AdminStudentExportSheet[];
}) {
  const students = await getStudentSummaryRows({
    studentId,
    scopedBranch
  });

  return buildDatasetFromStudents(students, selectedSheets);
}

async function buildDatasetFromStudents(
  students: AdminStudentExportStudentRow[],
  selectedSheets: readonly AdminStudentExportSheet[]
): Promise<AdminStudentExportDataset> {
  const detailSheets = new Set<AdminStudentExportDetailSheet>(
    selectedSheets.filter(
      (sheet): sheet is AdminStudentExportDetailSheet => sheet === "semesters" || sheet === "subjects"
    )
  );
  const studentIds = students.map((student) => student.student_id);
  const [semesters, subjects] = await Promise.all([
    detailSheets.has("semesters") ? getSemesterRows(studentIds) : Promise.resolve([]),
    detailSheets.has("subjects") ? getSubjectRows(studentIds) : Promise.resolve([])
  ]);

  return {
    students,
    semesters,
    subjects
  };
}
