import "server-only";

import { getSql } from "@/lib/db";

export type SupportIssueType =
  | "wrong_data"
  | "missing_record"
  | "link_problem"
  | "account_issue"
  | "other";

export type SupportIssueStatus = "open" | "in_progress" | "resolved" | "dismissed";

export type StudentSupportIssueRow = {
  id: number;
  issue_type: SupportIssueType;
  title: string;
  description: string;
  roll_no: string | null;
  link_status: string | null;
  status: SupportIssueStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type AdminSupportIssueRow = StudentSupportIssueRow & {
  app_user_id: number;
  email: string;
  display_name: string | null;
  student_id: number | null;
  student_name: string | null;
};

export type SupportIssueListResult<TIssue> = {
  rows: TIssue[];
  totalCount: number;
  page: number;
  pageSize: number;
};

let supportSchemaPromise: Promise<void> | null = null;

async function ensureSupportIssuesTable() {
  if (!supportSchemaPromise) {
    supportSchemaPromise = (async () => {
      const sql = getSql();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS support_issues (
          id BIGSERIAL PRIMARY KEY,
          app_user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
          student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,
          roll_no VARCHAR(32),
          link_status VARCHAR(32),
          issue_type VARCHAR(32) NOT NULL,
          title VARCHAR(160) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(24) NOT NULL DEFAULT 'open',
          admin_notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          resolved_at TIMESTAMPTZ
        )
      `);
      await sql.query(`
        CREATE INDEX IF NOT EXISTS ix_support_issues_app_user_id
          ON support_issues(app_user_id)
      `);
      await sql.query(`
        CREATE INDEX IF NOT EXISTS ix_support_issues_status
          ON support_issues(status, created_at DESC)
      `);
      await sql.query(`
        CREATE INDEX IF NOT EXISTS ix_support_issues_student_id
          ON support_issues(student_id)
      `);
    })().catch((error) => {
      supportSchemaPromise = null;
      throw error;
    });
  }

  await supportSchemaPromise;
}

export async function createSupportIssue({
  appUserId,
  studentId,
  rollNo,
  linkStatus,
  issueType,
  title,
  description
}: {
  appUserId: number;
  studentId: number | null;
  rollNo: string | null;
  linkStatus: string | null;
  issueType: SupportIssueType;
  title: string;
  description: string;
}) {
  await ensureSupportIssuesTable();
  const sql = getSql();

  const rows = (await sql`
    INSERT INTO support_issues (
      app_user_id,
      student_id,
      roll_no,
      link_status,
      issue_type,
      title,
      description
    )
    VALUES (
      ${appUserId},
      ${studentId},
      ${rollNo},
      ${linkStatus},
      ${issueType},
      ${title},
      ${description}
    )
    RETURNING id::int AS id
  `) as Array<{ id: number }>;

  return rows[0]?.id ?? null;
}

export async function listSupportIssuesForStudent(appUserId: number) {
  await ensureSupportIssuesTable();
  const sql = getSql();
  const page = 1;
  const pageSize = 20;

  const totalRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM support_issues
    WHERE app_user_id = ${appUserId}
      AND status IN ('open', 'in_progress')
  `) as Array<{ total: number }>;

  const rows = (await sql`
    SELECT
      id::int,
      issue_type,
      title,
      description,
      roll_no,
      link_status,
      status,
      admin_notes,
      created_at::text,
      updated_at::text,
      resolved_at::text
    FROM support_issues
    WHERE app_user_id = ${appUserId}
      AND status IN ('open', 'in_progress')
    ORDER BY created_at DESC, id DESC
    LIMIT ${pageSize}
  `) as StudentSupportIssueRow[];

  return {
    rows,
    totalCount: totalRows[0]?.total ?? 0,
    page,
    pageSize
  } satisfies SupportIssueListResult<StudentSupportIssueRow>;
}

export async function listSupportIssuesForStudentPaginated({
  appUserId,
  page = 1,
  pageSize = 10
}: {
  appUserId: number;
  page?: number;
  pageSize?: number;
}) {
  await ensureSupportIssuesTable();
  const sql = getSql();
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;
  const normalizedPageSize = Math.max(1, Math.min(50, Math.floor(pageSize)));
  const offset = (normalizedPage - 1) * normalizedPageSize;

  const totalRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM support_issues
    WHERE app_user_id = ${appUserId}
      AND status IN ('open', 'in_progress')
  `) as Array<{ total: number }>;

  const rows = (await sql`
    SELECT
      id::int,
      issue_type,
      title,
      description,
      roll_no,
      link_status,
      status,
      admin_notes,
      created_at::text,
      updated_at::text,
      resolved_at::text
    FROM support_issues
    WHERE app_user_id = ${appUserId}
      AND status IN ('open', 'in_progress')
    ORDER BY created_at DESC, id DESC
    LIMIT ${normalizedPageSize}
    OFFSET ${offset}
  `) as StudentSupportIssueRow[];

  return {
    rows,
    totalCount: totalRows[0]?.total ?? 0,
    page: normalizedPage,
    pageSize: normalizedPageSize
  } satisfies SupportIssueListResult<StudentSupportIssueRow>;
}

export async function listSupportIssuesForAdmin({
  page = 1,
  pageSize = 10
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  await ensureSupportIssuesTable();
  const sql = getSql();
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;
  const normalizedPageSize = Math.max(1, Math.min(50, Math.floor(pageSize)));
  const offset = (normalizedPage - 1) * normalizedPageSize;

  const totalRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM support_issues
  `) as Array<{ total: number }>;

  const rows = (await sql`
    SELECT
      si.id::int,
      si.app_user_id::int,
      au.email,
      au.display_name,
      si.student_id::int,
      st.name AS student_name,
      si.issue_type,
      si.title,
      si.description,
      si.roll_no,
      si.link_status,
      si.status,
      si.admin_notes,
      si.created_at::text,
      si.updated_at::text,
      si.resolved_at::text
    FROM support_issues si
    JOIN app_users au ON au.id = si.app_user_id
    LEFT JOIN students st ON st.id = si.student_id
    ORDER BY
      CASE si.status
        WHEN 'open' THEN 0
        WHEN 'in_progress' THEN 1
        WHEN 'resolved' THEN 2
        ELSE 3
      END,
      si.created_at DESC,
      si.id DESC
    LIMIT ${normalizedPageSize}
    OFFSET ${offset}
  `) as AdminSupportIssueRow[];

  return {
    rows,
    totalCount: totalRows[0]?.total ?? 0,
    page: normalizedPage,
    pageSize: normalizedPageSize
  } satisfies SupportIssueListResult<AdminSupportIssueRow>;
}

export async function updateSupportIssueForAdmin({
  issueId,
  status,
  adminNotes,
  adminUserId
}: {
  issueId: number;
  status: SupportIssueStatus;
  adminNotes: string | null;
  adminUserId: number;
}) {
  await ensureSupportIssuesTable();
  const sql = getSql();

  const beforeRows = (await sql`
    SELECT
      id::int,
      status,
      admin_notes
    FROM support_issues
    WHERE id = ${issueId}
    LIMIT 1
  `) as Array<{ id: number; status: string; admin_notes: string | null }>;

  const before = beforeRows[0] ?? null;
  if (!before) {
    throw new Error("Support issue not found.");
  }

  const rows = (await sql`
    UPDATE support_issues
    SET
      status = ${status},
      admin_notes = ${adminNotes},
      updated_at = NOW(),
      resolved_at = CASE
        WHEN ${status} = 'resolved' THEN NOW()
        ELSE NULL
      END
    WHERE id = ${issueId}
    RETURNING
      id::int AS id,
      status,
      admin_notes
  `) as Array<{ id: number; status: string; admin_notes: string | null }>;

  await sql`
    INSERT INTO admin_audit_logs (
      admin_user_id,
      action_key,
      target_table,
      target_id,
      before_json,
      after_json
    )
    VALUES (
      ${adminUserId},
      'support_issues.update',
      'support_issues',
      ${String(issueId)},
      ${JSON.stringify(before)}::jsonb,
      ${JSON.stringify(rows[0] ?? null)}::jsonb
    )
  `;

  return rows[0] ?? null;
}
