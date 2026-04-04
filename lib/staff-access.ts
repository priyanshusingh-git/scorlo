import "server-only";

import type { AppUser } from "@/lib/queries/app-users";
import { getSql } from "@/lib/db";
import { isMainAdminEmail } from "@/lib/admin/constants";

export const STAFF_TYPES = ["main_admin", "hod", "teacher", "placement_cell"] as const;
export type StaffType = (typeof STAFF_TYPES)[number];

export type StaffStatus = "active" | "suspended";

export type StaffProfile = {
  app_user_id: number;
  staff_type: StaffType;
  branch_name: string | null;
  status: StaffStatus;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
};

export type AdminSessionUser = AppUser & {
  staff_profile: StaffProfile;
};

let schemaReadyPromise: Promise<void> | null = null;

function normalizeStaffType(value: string): StaffType {
  if (STAFF_TYPES.includes(value as StaffType)) {
    return value as StaffType;
  }

  return "placement_cell";
}

function toStaffProfile(row: {
  app_user_id: number;
  staff_type: string;
  branch_name: string | null;
  status: string;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}): StaffProfile {
  return {
    app_user_id: row.app_user_id,
    staff_type: normalizeStaffType(row.staff_type),
    branch_name: row.branch_name,
    status: row.status === "suspended" ? "suspended" : "active",
    created_by_user_id: row.created_by_user_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export async function ensureStaffAccessSchema() {
  if (schemaReadyPromise) {
    await schemaReadyPromise;
    return;
  }

  schemaReadyPromise = (async () => {
    const sql = getSql();

    await sql.query(`
      CREATE TABLE IF NOT EXISTS staff_profiles (
        app_user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        staff_type VARCHAR(32) NOT NULL,
        branch_name TEXT,
        status VARCHAR(24) NOT NULL DEFAULT 'active',
        created_by_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await sql.query(`
      ALTER TABLE staff_profiles
      ADD COLUMN IF NOT EXISTS staff_type VARCHAR(32) NOT NULL DEFAULT 'placement_cell'
    `);

    await sql.query(`
      ALTER TABLE staff_profiles
      ADD COLUMN IF NOT EXISTS branch_name TEXT
    `);

    await sql.query(`
      ALTER TABLE staff_profiles
      ADD COLUMN IF NOT EXISTS status VARCHAR(24) NOT NULL DEFAULT 'active'
    `);

    await sql.query(`
      ALTER TABLE staff_profiles
      ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL
    `);

    await sql.query(`
      ALTER TABLE staff_profiles
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await sql.query(`
      ALTER TABLE staff_profiles
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await sql.query(`
      CREATE INDEX IF NOT EXISTS ix_staff_profiles_branch_name
      ON staff_profiles(branch_name)
    `);

    await sql.query(`
      CREATE INDEX IF NOT EXISTS ix_staff_profiles_staff_type
      ON staff_profiles(staff_type)
    `);
  })();

  await schemaReadyPromise;
}

export async function getStaffProfileForAppUser(appUser: AppUser | null) {
  if (!appUser || appUser.role !== "admin") {
    return null;
  }

  await ensureStaffAccessSchema();
  const sql = getSql();

  const bootstrapStaffType: StaffType = isMainAdminEmail(appUser.email) ? "main_admin" : "placement_cell";

  const rows = (await sql`
    INSERT INTO staff_profiles (app_user_id, staff_type, status)
    VALUES (${appUser.id}, ${bootstrapStaffType}, 'active')
    ON CONFLICT (app_user_id)
    DO UPDATE SET
      staff_type = CASE
        WHEN ${isMainAdminEmail(appUser.email)} THEN 'main_admin'
        ELSE staff_profiles.staff_type
      END,
      updated_at = CASE
        WHEN ${isMainAdminEmail(appUser.email)} THEN NOW()
        ELSE staff_profiles.updated_at
      END
    RETURNING
      app_user_id::int,
      staff_type,
      branch_name,
      status,
      created_by_user_id::int,
      created_at::text,
      updated_at::text
  `) as Array<{
    app_user_id: number;
    staff_type: string;
    branch_name: string | null;
    status: string;
    created_by_user_id: number | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows[0] ? toStaffProfile(rows[0]) : null;
}

export async function getStaffProfileByUserId(appUserId: number) {
  await ensureStaffAccessSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      sp.app_user_id::int,
      sp.staff_type,
      sp.branch_name,
      sp.status,
      sp.created_by_user_id::int,
      sp.created_at::text,
      sp.updated_at::text
    FROM staff_profiles sp
    WHERE sp.app_user_id = ${appUserId}
    LIMIT 1
  `) as Array<{
    app_user_id: number;
    staff_type: string;
    branch_name: string | null;
    status: string;
    created_by_user_id: number | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows[0] ? toStaffProfile(rows[0]) : null;
}

export function isMainAdminStaff(user: { staff_profile: { staff_type: StaffType } }) {
  return user.staff_profile.staff_type === "main_admin";
}

export function isHodStaff(user: { staff_profile: { staff_type: StaffType } }) {
  return user.staff_profile.staff_type === "hod";
}

export function canReadStudentsAsStaff(user: { staff_profile: { status: StaffStatus } }) {
  return user.staff_profile.status === "active";
}

export function getBranchScopedAccess(user: { staff_profile: { staff_type: StaffType; branch_name: string | null } }) {
  return user.staff_profile.staff_type === "hod" || user.staff_profile.staff_type === "teacher"
    ? user.staff_profile.branch_name
    : null;
}

export function canCreateStaffType(
  actor: { staff_profile: { staff_type: StaffType; branch_name: string | null } },
  targetStaffType: StaffType
) {
  if (actor.staff_profile.staff_type === "main_admin") {
    return targetStaffType !== "main_admin";
  }

  if (actor.staff_profile.staff_type === "hod") {
    return targetStaffType === "teacher" && Boolean(actor.staff_profile.branch_name);
  }

  return false;
}

export function canManageStaffDirectory(user: { staff_profile: { staff_type: StaffType } }) {
  return user.staff_profile.staff_type === "main_admin" || user.staff_profile.staff_type === "hod";
}
