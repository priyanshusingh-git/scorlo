import "server-only";

import { ensureAppRuntimeControlsSchema } from "@/lib/app-runtime-controls";
import { MAIN_ADMIN_EMAIL, MAIN_ADMIN_NAME } from "@/lib/admin/constants";
import { getSql } from "@/lib/db";
import { ensureStaffAccessSchema, type StaffType } from "@/lib/staff-access";

export type AdminOverview = {
  counts: {
    totalUsers: number;
    totalAdmins: number;
    linkedAccounts: number;
    pendingRequests: number;
    rejectedLinks: number;
    totalStudents: number;
    totalRankingRows: number;
  };
  recentLogins: Array<{
    id: number;
    email: string;
    display_name: string | null;
    role: string;
    last_login_at: string | null;
  }>;
  recentAuditLogs: Array<{
    id: number;
    action_key: string;
    target_table: string;
    target_id: string;
    created_at: string;
    admin_email: string;
  }>;
};

export type AdminAccountRow = {
  id: number;
  email: string;
  display_name: string | null;
  email_verified: boolean;
  role: "admin";
  staff_type: StaffType;
  branch_name: string | null;
  status: string;
  is_main_admin: boolean;
};

export type AdminUserRow = {
  id: number;
  email: string;
  display_name: string | null;
  email_verified: boolean;
  role: "student" | "admin";
  dashboard_access_enabled: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  student_link_id: number | null;
  link_roll_no: string | null;
  link_dob: string | null;
  link_status: string | null;
  student_id: number | null;
  student_name: string | null;
  latest_request_id: number | null;
  latest_request_roll_no: string | null;
  latest_request_status: string | null;
  latest_request_notes: string | null;
  latest_request_dob: string | null;
};

export type AdminLinkRow = {
  id: number;
  app_user_id: number;
  email: string;
  role: "student" | "admin";
  roll_no: string;
  dob: string;
  status: string;
  student_id: number | null;
  student_name: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminDataRequestRow = {
  id: number;
  app_user_id: number;
  email: string;
  roll_no: string;
  dob: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminStudentSearchRow = {
  id: number;
  batch_rank: number | null;
  roll_no: string;
  name: string | null;
  branch_name: string | null;
  course_name: string | null;
  institute_name: string | null;
  passing_year: number | null;
  cgpa: string | null;
  overall_percentage: string | null;
  latest_sgpa: string | null;
  active_backs: number;
  cleared_backs: number;
  linked_app_user_id: number | null;
  linked_email: string | null;
  linked_status: string | null;
  linked_dob: string | null;
};

export type AdminStudentDetail = AdminStudentSearchRow & {
  enrollment_no: string | null;
  father_name: string | null;
  mother_name: string | null;
  gender: string | null;
  institute_code: string | null;
  course_code: string | null;
  branch_code: string | null;
  recent_semesters: Array<{
    semester_no: number;
    sgpa: string | null;
    result_status: string | null;
    session_id: string | null;
    session_type: string | null;
    date_of_declaration: string | null;
    total_marks_obtained: number | null;
    marks_maximum: number | null;
    max_marks: number | null;
    percentage: string | null;
  }>;
};

export type AdminStudentSearchResult = {
  rows: AdminStudentSearchRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  availableBranches: string[];
  availableCourses: string[];
};

export type AdminMaintenanceInfo = {
  totalRankingRows: number;
  totalDashboardCacheRows: number;
  recentRankingRebuilds: Array<{
    id: number;
    created_at: string;
    admin_email: string;
    after_json: Record<string, unknown> | null;
  }>;
  recentDashboardCacheActions: Array<{
    id: number;
    action_key: string;
    created_at: string;
    admin_email: string;
    after_json: Record<string, unknown> | null;
  }>;
};

function buildSearchPattern(query: string | undefined) {
  const trimmed = query?.trim() ?? "";
  return {
    enabled: trimmed.length > 0,
    value: trimmed ? `%${trimmed}%` : ""
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const sql = getSql();
  const countsRows = (await sql`
    SELECT
      (SELECT COUNT(*)::int FROM app_users) AS total_users,
      (SELECT COUNT(*)::int FROM app_users WHERE role = 'admin') AS total_admins,
      (SELECT COUNT(*)::int FROM student_links WHERE status = 'linked') AS linked_accounts,
      (SELECT COUNT(*)::int FROM data_requests WHERE status = 'pending') AS pending_requests,
      (SELECT COUNT(*)::int FROM student_links WHERE status = 'rejected') AS rejected_links,
      (SELECT COUNT(*)::int FROM students) AS total_students,
      (SELECT COUNT(*)::int FROM student_rankings) AS total_ranking_rows
  `) as Array<{
    total_users: number;
    total_admins: number;
    linked_accounts: number;
    pending_requests: number;
    rejected_links: number;
    total_students: number;
    total_ranking_rows: number;
  }>;

  const recentLogins = (await sql`
    SELECT
      id,
      email,
      display_name,
      role,
      last_login_at::text
    FROM app_users
    WHERE last_login_at IS NOT NULL
    ORDER BY last_login_at DESC, id DESC
    LIMIT 5
  `) as AdminOverview["recentLogins"];

  const recentAuditLogs = (await sql`
    SELECT
      aal.id,
      aal.action_key,
      aal.target_table,
      aal.target_id,
      aal.created_at::text,
      au.email AS admin_email
    FROM admin_audit_logs aal
    JOIN app_users au ON au.id = aal.admin_user_id
    ORDER BY aal.created_at DESC, aal.id DESC
    LIMIT 5
  `) as AdminOverview["recentAuditLogs"];

  const counts = countsRows[0];

  return {
    counts: {
      totalUsers: counts?.total_users ?? 0,
      totalAdmins: counts?.total_admins ?? 0,
      linkedAccounts: counts?.linked_accounts ?? 0,
      pendingRequests: counts?.pending_requests ?? 0,
      rejectedLinks: counts?.rejected_links ?? 0,
      totalStudents: counts?.total_students ?? 0,
      totalRankingRows: counts?.total_ranking_rows ?? 0
    },
    recentLogins,
    recentAuditLogs
  };
}

export async function searchAdminUsers({
  query,
  role = "student"
}: {
  query?: string;
  role?: string;
}) {
  await ensureAppRuntimeControlsSchema();
  const sql = getSql();
  const pattern = buildSearchPattern(query);
  const roleFilter = role?.trim() ?? "";

  return (await sql`
    SELECT
      au.id,
      au.email,
      au.display_name,
      au.email_verified,
      au.role,
      COALESCE(aua.dashboard_access_enabled, TRUE) AS dashboard_access_enabled,
      au.created_at::text,
      au.updated_at::text,
      au.last_login_at::text,
      sl.id AS student_link_id,
      sl.roll_no AS link_roll_no,
      sl.dob AS link_dob,
      sl.status AS link_status,
      sl.student_id,
      st.name AS student_name,
      dr.id AS latest_request_id,
      dr.roll_no AS latest_request_roll_no,
      dr.status AS latest_request_status,
      dr.notes AS latest_request_notes,
      dr.dob AS latest_request_dob
    FROM app_users au
    LEFT JOIN app_user_access aua ON aua.app_user_id = au.id
    LEFT JOIN student_links sl ON sl.app_user_id = au.id
    LEFT JOIN students st ON st.id = sl.student_id
    LEFT JOIN LATERAL (
      SELECT id, roll_no, status, notes, dob
      FROM data_requests
      WHERE app_user_id = au.id
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    ) dr ON TRUE
    WHERE (${roleFilter} = '' OR au.role = ${roleFilter})
      AND (
        ${!pattern.enabled}
        OR au.email ILIKE ${pattern.value}
        OR COALESCE(au.display_name, '') ILIKE ${pattern.value}
        OR COALESCE(sl.roll_no, '') ILIKE ${pattern.value}
        OR COALESCE(st.name, '') ILIKE ${pattern.value}
      )
    ORDER BY au.updated_at DESC, au.id DESC
    LIMIT 50
  `) as AdminUserRow[];
}

export async function searchAdminAccounts({ query }: { query?: string }) {
  await ensureStaffAccessSchema();
  const sql = getSql();
  const pattern = buildSearchPattern(query);

  return (await sql`
    SELECT
      au.id,
      au.email,
      CASE
        WHEN au.email = ${MAIN_ADMIN_EMAIL} THEN ${MAIN_ADMIN_NAME}
        ELSE au.display_name
      END AS display_name,
      au.email_verified,
      au.role,
      COALESCE(sp.staff_type, CASE WHEN au.email = ${MAIN_ADMIN_EMAIL} THEN 'main_admin' ELSE 'placement_cell' END) AS staff_type,
      sp.branch_name,
      COALESCE(sp.status, 'active') AS status,
      (au.email = ${MAIN_ADMIN_EMAIL}) AS is_main_admin
    FROM app_users au
    LEFT JOIN staff_profiles sp ON sp.app_user_id = au.id
    WHERE au.role = 'admin'
      AND (
        ${!pattern.enabled}
        OR au.email ILIKE ${pattern.value}
        OR (
          CASE
            WHEN au.email = ${MAIN_ADMIN_EMAIL} THEN ${MAIN_ADMIN_NAME}
            ELSE COALESCE(au.display_name, '')
          END
        ) ILIKE ${pattern.value}
      )
    ORDER BY (au.email = ${MAIN_ADMIN_EMAIL}) DESC, au.updated_at DESC, au.id DESC
    LIMIT 50
  `) as AdminAccountRow[];
}

export async function getAvailableAdminBranches() {
  const sql = getSql();
  const rows = (await sql`
    SELECT DISTINCT branch_name
    FROM students
    WHERE branch_name IS NOT NULL
      AND branch_name <> ''
    ORDER BY branch_name ASC
  `) as Array<{ branch_name: string }>;

  return rows.map((row) => row.branch_name);
}

export async function searchAdminLinks({
  query,
  status
}: {
  query?: string;
  status?: string;
}) {
  const sql = getSql();
  const pattern = buildSearchPattern(query);
  const statusFilter = status?.trim() ?? "";

  return (await sql`
    SELECT
      sl.id,
      sl.app_user_id,
      au.email,
      au.role,
      sl.roll_no,
      sl.dob,
      sl.status,
      sl.student_id,
      st.name AS student_name,
      sl.created_at::text,
      sl.updated_at::text
    FROM student_links sl
    JOIN app_users au ON au.id = sl.app_user_id
    LEFT JOIN students st ON st.id = sl.student_id
    WHERE (${statusFilter} = '' OR sl.status = ${statusFilter})
      AND (
        ${!pattern.enabled}
        OR sl.roll_no ILIKE ${pattern.value}
        OR au.email ILIKE ${pattern.value}
        OR COALESCE(st.name, '') ILIKE ${pattern.value}
      )
    ORDER BY sl.updated_at DESC, sl.id DESC
    LIMIT 50
  `) as AdminLinkRow[];
}

export async function searchAdminDataRequests({
  query,
  status
}: {
  query?: string;
  status?: string;
}) {
  const sql = getSql();
  const pattern = buildSearchPattern(query);
  const statusFilter = status?.trim() ?? "";

  return (await sql`
    SELECT
      dr.id,
      dr.app_user_id,
      au.email,
      dr.roll_no,
      dr.dob,
      dr.status,
      dr.notes,
      dr.created_at::text,
      dr.updated_at::text
    FROM data_requests dr
    JOIN app_users au ON au.id = dr.app_user_id
    WHERE (${statusFilter} = '' OR dr.status = ${statusFilter})
      AND (
        ${!pattern.enabled}
        OR dr.roll_no ILIKE ${pattern.value}
        OR au.email ILIKE ${pattern.value}
        OR COALESCE(dr.notes, '') ILIKE ${pattern.value}
      )
    ORDER BY dr.updated_at DESC, dr.id DESC
    LIMIT 50
  `) as AdminDataRequestRow[];
}

export async function searchAdminStudents({
  query,
  branch,
  scopedBranch,
  course,
  page = 1,
  pageSize = 10
}: {
  query?: string;
  branch?: string;
  scopedBranch?: string | null;
  course?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminStudentSearchResult> {
  const sql = getSql();
  const pattern = buildSearchPattern(query);
  const branchFilter = scopedBranch?.trim() || branch?.trim() || "";
  const courseFilter = course?.trim() ?? "";
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;
  const normalizedPageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
  const offset = (normalizedPage - 1) * normalizedPageSize;

  const filterRows = (await sql`
    SELECT
      COALESCE(
        ARRAY(
          SELECT DISTINCT branch_name
          FROM students
          WHERE branch_name IS NOT NULL
            AND branch_name <> ''
            AND (${branchFilter} = '' OR COALESCE(branch_name, '') = ${branchFilter})
          ORDER BY branch_name ASC
        ),
        ARRAY[]::text[]
      ) AS available_branches,
      COALESCE(
        ARRAY(
          SELECT DISTINCT course_name
          FROM students
          WHERE course_name IS NOT NULL
            AND course_name <> ''
            AND (${branchFilter} = '' OR COALESCE(branch_name, '') = ${branchFilter})
          ORDER BY course_name ASC
        ),
        ARRAY[]::text[]
      ) AS available_courses
  `) as Array<{
    available_branches: string[] | null;
    available_courses: string[] | null;
  }>;

  const totalRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM students s
    WHERE (
      ${!pattern.enabled}
      OR s.roll_no ILIKE ${pattern.value}
      OR COALESCE(s.name, '') ILIKE ${pattern.value}
      OR COALESCE(s.institute_name, '') ILIKE ${pattern.value}
    )
      AND (${branchFilter} = '' OR COALESCE(s.branch_name, '') = ${branchFilter})
      AND (${courseFilter} = '' OR COALESCE(s.course_name, '') = ${courseFilter})
  `) as Array<{ total: number }>;

  const rows = (await sql`
    SELECT
      s.id,
      sr.rank AS batch_rank,
      s.roll_no,
      s.enrollment_no,
      s.name,
      s.father_name,
      s.mother_name,
      s.gender,
      s.institute_code,
      s.branch_name,
      s.branch_code,
      s.course_name,
      s.course_code,
      s.institute_name,
      s.passing_year,
      sm.cgpa::text,
      sm.overall_percentage::text,
      sm.latest_sgpa::text,
      COALESCE(sm.active_backs, 0) AS active_backs,
      COALESCE(sm.cleared_backs, 0) AS cleared_backs,
      au.id AS linked_app_user_id,
      au.email AS linked_email,
      sl.status AS linked_status,
      sl.dob AS linked_dob
    FROM students s
    LEFT JOIN student_metrics sm ON sm.student_id = s.id
    LEFT JOIN student_rankings sr
      ON sr.student_id = s.id
     AND sr.scope_key = 'batch'
     AND sr.metric_key = 'percentage'
     AND sr.semester_no = 0
    LEFT JOIN student_links sl ON sl.student_id = s.id
    LEFT JOIN app_users au ON au.id = sl.app_user_id
    WHERE (
      ${!pattern.enabled}
      OR s.roll_no ILIKE ${pattern.value}
      OR COALESCE(s.name, '') ILIKE ${pattern.value}
      OR COALESCE(s.institute_name, '') ILIKE ${pattern.value}
    )
      AND (${branchFilter} = '' OR COALESCE(s.branch_name, '') = ${branchFilter})
      AND (${courseFilter} = '' OR COALESCE(s.course_name, '') = ${courseFilter})
    ORDER BY sr.rank ASC NULLS LAST, s.roll_no ASC
    LIMIT ${normalizedPageSize}
    OFFSET ${offset}
  `) as AdminStudentSearchRow[];

  return {
    rows,
    totalCount: totalRows[0]?.total ?? 0,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    availableBranches: filterRows[0]?.available_branches ?? [],
    availableCourses: filterRows[0]?.available_courses ?? []
  };
}

export async function getAdminStudentDetail(studentId: number): Promise<AdminStudentDetail | null> {
  return getAdminStudentDetailForScope(studentId, null);
}

export async function getAdminStudentDetailForScope(
  studentId: number,
  scopedBranch: string | null
): Promise<AdminStudentDetail | null> {
  const sql = getSql();
  const students = (await sql`
    SELECT
      s.id,
      s.roll_no,
      s.enrollment_no,
      s.name,
      s.father_name,
      s.mother_name,
      s.gender,
      s.institute_code,
      s.branch_name,
      s.branch_code,
      s.course_name,
      s.course_code,
      s.institute_name,
      s.passing_year,
      sm.cgpa::text,
      sm.overall_percentage::text,
      sm.latest_sgpa::text,
      COALESCE(sm.active_backs, 0) AS active_backs,
      COALESCE(sm.cleared_backs, 0) AS cleared_backs,
      au.id AS linked_app_user_id,
      au.email AS linked_email,
      sl.status AS linked_status,
      sl.dob AS linked_dob
    FROM students s
    LEFT JOIN student_metrics sm ON sm.student_id = s.id
    LEFT JOIN student_links sl ON sl.student_id = s.id
    LEFT JOIN app_users au ON au.id = sl.app_user_id
    WHERE s.id = ${studentId}
      AND (${scopedBranch ?? ""} = '' OR COALESCE(s.branch_name, '') = ${scopedBranch ?? ""})
    LIMIT 1
  `) as Array<Omit<AdminStudentDetail, "recent_semesters">>;

  const student = students[0] ?? null;
  if (!student) return null;

  const recentSemesters = (await sql`
    WITH ranked_semesters AS (
      SELECT
        sr.id AS semester_result_id,
        sr.semester_no,
        sr.sgpa::text AS sgpa,
        sr.result_status,
        rs.session_id,
        rs.session_type,
        sr.date_of_declaration::text,
        sr.total_marks_obtained,
        rs.marks_maximum,
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
      semester_result_id,
      semester_no,
      sgpa,
      result_status,
      session_id,
      session_type,
      date_of_declaration,
      total_marks_obtained,
      marks_maximum,
      (
        SELECT COUNT(*)::int
        FROM subject_results sub
        WHERE sub.semester_result_id = semester_result_id
          AND sub.type IN ('Theory', 'Practical')
      ) AS credit_subjects_count
    FROM ranked_semesters
    WHERE row_no = 1
    ORDER BY semester_no DESC
    LIMIT 8
  `) as Array<{
    semester_result_id: number;
    semester_no: number;
    sgpa: string | null;
    result_status: string | null;
    session_id: string | null;
    session_type: string | null;
    date_of_declaration: string | null;
    total_marks_obtained: number | null;
    marks_maximum: number | null;
    credit_subjects_count: number;
  }>;

  const compiledSemesters = recentSemesters.map((sem) => {
    const semesterMaxMarks = sem.credit_subjects_count > 0 ? sem.credit_subjects_count * 100 : null;

    const percentage =
      sem.total_marks_obtained !== null && semesterMaxMarks !== null && semesterMaxMarks > 0
        ? ((sem.total_marks_obtained / semesterMaxMarks) * 100).toFixed(2)
        : null;

    return {
      semester_no: sem.semester_no,
      sgpa: sem.sgpa,
      result_status: sem.result_status,
      session_id: sem.session_id,
      session_type: sem.session_type,
      date_of_declaration: sem.date_of_declaration,
      total_marks_obtained: sem.total_marks_obtained,
      marks_maximum: sem.marks_maximum,
      max_marks: semesterMaxMarks,
      percentage
    };
  });

  return {
    ...student,
    recent_semesters: compiledSemesters
  };
}

export async function getAdminMaintenanceInfo(): Promise<AdminMaintenanceInfo> {
  const sql = getSql();
  const rankingCountRows = (await sql`
    SELECT COUNT(*)::int AS total_ranking_rows
    FROM student_rankings
  `) as Array<{ total_ranking_rows: number }>;

  const dashboardTableRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'student_app_snapshot_cache'
  `) as Array<{ total: number }>;

  const totalDashboardCacheRows =
    (dashboardTableRows[0]?.total ?? 0) > 0
      ? ((await sql`
          SELECT COUNT(*)::int AS total_dashboard_cache_rows
          FROM student_app_snapshot_cache
        `) as Array<{ total_dashboard_cache_rows: number }>)[0]?.total_dashboard_cache_rows ?? 0
      : 0;

  const recentRankingRebuilds = (await sql`
    SELECT
      aal.id,
      aal.created_at::text,
      au.email AS admin_email,
      aal.after_json
    FROM admin_audit_logs aal
    JOIN app_users au ON au.id = aal.admin_user_id
    WHERE aal.action_key = 'rankings.rebuild'
    ORDER BY aal.created_at DESC, aal.id DESC
    LIMIT 10
  `) as AdminMaintenanceInfo["recentRankingRebuilds"];

  const recentDashboardCacheActions =
    (dashboardTableRows[0]?.total ?? 0) > 0
      ? ((await sql`
          SELECT
            aal.id,
            aal.action_key,
            aal.created_at::text,
            au.email AS admin_email,
            aal.after_json
          FROM admin_audit_logs aal
          JOIN app_users au ON au.id = aal.admin_user_id
          WHERE aal.target_table = 'student_app_snapshot_cache'
          ORDER BY aal.created_at DESC, aal.id DESC
          LIMIT 10
        `) as AdminMaintenanceInfo["recentDashboardCacheActions"])
      : [];

  return {
    totalRankingRows: rankingCountRows[0]?.total_ranking_rows ?? 0,
    totalDashboardCacheRows,
    recentRankingRebuilds,
    recentDashboardCacheActions
  };
}
