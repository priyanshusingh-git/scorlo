import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { ensureAppRuntimeControlsSchema } from "@/lib/app-runtime-controls";
import { MAIN_ADMIN_EMAIL, MAIN_ADMIN_NAME, isMainAdminEmail } from "@/lib/admin/constants";
import { getSql } from "@/lib/db";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import {
  canCreateStaffType,
  ensureStaffAccessSchema,
  getStaffProfileByUserId,
  type StaffType
} from "@/lib/staff-access";
import {
  clearAllDashboardCaches,
  countDashboardCacheRows,
  deleteDashboardCacheForStudent,
  rebuildDashboardCacheForStudent,
  rebuildDashboardCachesForPassingYear,
  rebuildDashboardCachesForLinkedStudents
} from "@/lib/queries/dashboard";

function toAuditJson(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_, item) => {
      if (typeof item === "bigint") return item.toString();
      if (item instanceof Date) return item.toISOString();
      return item;
    })
  ) as Prisma.JsonObject | Prisma.JsonArray | null;
}

async function logAdminAudit(
  tx: Prisma.TransactionClient | PrismaClient,
  {
    adminUserId,
    actionKey,
    targetTable,
    targetId,
    beforeJson,
    afterJson
  }: {
    adminUserId: number;
    actionKey: string;
    targetTable: string;
    targetId: string | number;
    beforeJson?: unknown;
    afterJson?: unknown;
  }
) {
  await tx.admin_audit_logs.create({
    data: {
      admin_user_id: BigInt(adminUserId),
      action_key: actionKey,
      target_table: targetTable,
      target_id: String(targetId),
      before_json: beforeJson === undefined ? Prisma.JsonNull : (toAuditJson(beforeJson) ?? Prisma.JsonNull),
      after_json: afterJson === undefined ? Prisma.JsonNull : (toAuditJson(afterJson) ?? Prisma.JsonNull)
    }
  });
}

async function getAdminCount(tx: Prisma.TransactionClient | PrismaClient) {
  return tx.appUser.count({ where: { role: "admin" } });
}

async function getActingAdmin(tx: Prisma.TransactionClient | PrismaClient, adminUserId: number) {
  const admin = await tx.appUser.findUnique({
    where: { id: BigInt(adminUserId) }
  });

  if (!admin || admin.role !== "admin") {
    throw new Error("Admin account not found.");
  }

  return admin;
}

function canManageAdminAccounts(admin: { email: string }) {
  return isMainAdminEmail(admin.email);
}

function isAllowedStaffEmail(email: string) {
  return email.endsWith("@glbitm.ac.in") || email.endsWith("@scorlo.in");
}

async function upsertStaffProfileRecord(
  tx: Prisma.TransactionClient | PrismaClient,
  input: {
    appUserId: number;
    staffType: StaffType;
    branchName?: string | null;
    status?: "active" | "suspended";
    createdByUserId?: number | null;
  }
) {
  const rows = await tx.$queryRaw<Array<{
    app_user_id: bigint;
    staff_type: string;
    branch_name: string | null;
    status: string;
    created_by_user_id: bigint | null;
    created_at: Date;
    updated_at: Date;
  }>>`
    INSERT INTO staff_profiles (
      app_user_id,
      staff_type,
      branch_name,
      status,
      created_by_user_id
    )
    VALUES (
      ${BigInt(input.appUserId)},
      ${input.staffType},
      ${input.branchName ?? null},
      ${input.status ?? "active"},
      ${input.createdByUserId ? BigInt(input.createdByUserId) : null}
    )
    ON CONFLICT (app_user_id)
    DO UPDATE SET
      staff_type = EXCLUDED.staff_type,
      branch_name = EXCLUDED.branch_name,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING
      app_user_id,
      staff_type,
      branch_name,
      status,
      created_by_user_id,
      created_at,
      updated_at
  `;

  return rows[0];
}

async function ensurePendingRequest(
  tx: Prisma.TransactionClient | PrismaClient,
  {
    appUserId,
    rollNo,
    dob
  }: {
    appUserId: bigint;
    rollNo: string;
    dob: string;
  }
) {
  const existing = await tx.dataRequest.findFirst({
    where: {
      appUserId,
      rollNo,
      status: "pending"
    }
  });

  if (existing) {
    return tx.dataRequest.update({
      where: { id: existing.id },
      data: {
        dob,
        updatedAt: new Date()
      }
    });
  }

  return tx.dataRequest.create({
    data: {
      appUserId,
      rollNo,
      dob,
      status: "pending"
    }
  });
}

async function resolveStudentByRollNo(
  tx: Prisma.TransactionClient | PrismaClient,
  rollNo: string
) {
  return tx.students.findUnique({
    where: { roll_no: rollNo }
  });
}

async function assignStudentToUser(
  tx: Prisma.TransactionClient | PrismaClient,
  {
    appUserId,
    studentId,
    rollNo,
    dob,
    preserveDataRequestId
  }: {
    appUserId: bigint;
    studentId: bigint;
    rollNo: string;
    dob: string;
    preserveDataRequestId?: bigint | null;
  }
) {
  const conflictingStudentLink = await tx.studentLink.findUnique({
    where: { studentId }
  });

  if (conflictingStudentLink && conflictingStudentLink.appUserId !== appUserId) {
    await tx.studentLink.update({
      where: { id: conflictingStudentLink.id },
      data: {
        studentId: null,
        status: "pending_data",
        updatedAt: new Date()
      }
    });

    await ensurePendingRequest(tx, {
      appUserId: conflictingStudentLink.appUserId,
      rollNo: conflictingStudentLink.rollNo,
      dob: conflictingStudentLink.dob
    });
  }

  const targetLink = await tx.studentLink.findUnique({
    where: { appUserId }
  });

  const previousStudentId = targetLink?.studentId ?? null;

  const link = targetLink
    ? await tx.studentLink.update({
        where: { id: targetLink.id },
        data: {
          studentId,
          rollNo,
          dob,
          status: "linked",
          updatedAt: new Date()
        }
      })
    : await tx.studentLink.create({
        data: {
          appUserId,
          studentId,
          rollNo,
          dob,
          status: "linked"
        }
      });

  await tx.dataRequest.deleteMany({
    where: {
      appUserId,
      rollNo,
      ...(preserveDataRequestId ? { id: { not: preserveDataRequestId } } : {})
    }
  });

  return {
    link,
    previousStudentId:
      previousStudentId !== null && previousStudentId !== studentId ? Number(previousStudentId) : null
  };
}

type AssignedStudentLinkResult = Awaited<ReturnType<typeof assignStudentToUser>>;

function isAssignedStudentLinkResult(
  value: Awaited<ReturnType<typeof prisma.studentLink.update>> | AssignedStudentLinkResult
): value is AssignedStudentLinkResult {
  return "link" in value;
}

export async function updateUserRole(
  adminUserId: number,
  targetUserId: number,
  role: "student" | "admin"
) {
  return prisma.$transaction(async (tx) => {
    const targetUser = await tx.appUser.findUnique({
      where: { id: BigInt(targetUserId) }
    });

    if (!targetUser) {
      throw new Error("User not found.");
    }

    if (targetUser.role !== role) {
      throw new Error("Role conversion is disabled. Admin accounts are managed separately.");
    }

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "users.role_noop",
      targetTable: "app_users",
      targetId: targetUserId,
      beforeJson: targetUser,
      afterJson: targetUser
    });

    return targetUser;
  });
}

export async function updateUserDashboardAccess(
  adminUserId: number,
  targetUserId: number,
  dashboardAccessEnabled: boolean
) {
  await ensureAppRuntimeControlsSchema();

  return prisma.$transaction(async (tx) => {
    const targetUser = await tx.appUser.findUnique({
      where: { id: BigInt(targetUserId) }
    });

    if (!targetUser) {
      throw new Error("User not found.");
    }

    if (targetUser.role !== "student") {
      throw new Error("Dashboard access can only be changed for student accounts.");
    }

    const existingAccessRows = await tx.$queryRaw<Array<{
      app_user_id: bigint;
      dashboard_access_enabled: boolean;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT app_user_id, dashboard_access_enabled, created_at, updated_at
      FROM app_user_access
      WHERE app_user_id = ${targetUser.id}
      LIMIT 1
    `;

    const updatedAccessRows = await tx.$queryRaw<Array<{
      app_user_id: bigint;
      dashboard_access_enabled: boolean;
      created_at: Date;
      updated_at: Date;
    }>>`
      INSERT INTO app_user_access (app_user_id, dashboard_access_enabled)
      VALUES (${targetUser.id}, ${dashboardAccessEnabled})
      ON CONFLICT (app_user_id)
      DO UPDATE SET
        dashboard_access_enabled = EXCLUDED.dashboard_access_enabled,
        updated_at = NOW()
      RETURNING app_user_id, dashboard_access_enabled, created_at, updated_at
    `;
    const existingAccess = existingAccessRows[0] ?? null;
    const updatedAccess = updatedAccessRows[0];

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "app_user_access.update",
      targetTable: "app_user_access",
      targetId: targetUserId,
      beforeJson: existingAccess ?? {
        app_user_id: targetUserId,
        dashboard_access_enabled: true
      },
      afterJson: updatedAccess
    });

    return updatedAccess;
  });
}

async function autoApprovePendingDataRequests(adminUserId: number) {
  const result = await prisma.$transaction(async (tx) => {
    const pendingRequests = await tx.dataRequest.findMany({
      where: { status: "pending" },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }]
    });

    const cacheStudentIds = new Set<number>();
    const staleCacheStudentIds = new Set<number>();
    let approvedCount = 0;

    for (const request of pendingRequests) {
      const student = await resolveStudentByRollNo(tx, request.rollNo);
      if (!student) {
        continue;
      }

      const linkedResult = await assignStudentToUser(tx, {
        appUserId: request.appUserId,
        studentId: student.id,
        rollNo: request.rollNo,
        dob: request.dob,
        preserveDataRequestId: request.id
      });

      await tx.dataRequest.update({
        where: { id: request.id },
        data: {
          status: "approved",
          updatedAt: new Date()
        }
      });

      approvedCount += 1;
      cacheStudentIds.add(Number(student.id));

      if (linkedResult.previousStudentId !== null) {
        staleCacheStudentIds.add(linkedResult.previousStudentId);
      }
    }

    return {
      approvedCount,
      pendingCount: pendingRequests.length - approvedCount,
      cacheStudentIds: Array.from(cacheStudentIds),
      staleCacheStudentIds: Array.from(staleCacheStudentIds)
    };
  });

  for (const staleStudentId of result.staleCacheStudentIds) {
    if (!result.cacheStudentIds.includes(staleStudentId)) {
      await deleteDashboardCacheForStudent(staleStudentId);
    }
  }

  for (const studentId of result.cacheStudentIds) {
    await rebuildDashboardCacheForStudent(studentId);
  }

  await logAdminAudit(prisma, {
    adminUserId,
    actionKey: "app_runtime_settings.auto_link_pending",
    targetTable: "data_requests",
    targetId: "pending",
    beforeJson: null,
    afterJson: {
      approved_count: result.approvedCount,
      still_pending_count: result.pendingCount
    }
  });

  return result;
}

export async function updateAppRuntimeSettings(
  adminUserId: number,
  input: {
    signupsEnabled?: boolean;
    linkingEnabled?: boolean;
  }
) {
  await ensureAppRuntimeControlsSchema();

  const result = await prisma.$transaction(async (tx) => {
    const existingRows = await tx.$queryRaw<Array<{
      id: number;
      signups_enabled: boolean;
      linking_enabled: boolean;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT id, signups_enabled, linking_enabled, created_at, updated_at
      FROM app_runtime_settings
      WHERE id = 1
      LIMIT 1
    `;
    const existing = existingRows[0];

    const nextSettingsRows = await tx.$queryRaw<Array<{
      id: number;
      signups_enabled: boolean;
      linking_enabled: boolean;
      created_at: Date;
      updated_at: Date;
    }>>`
      UPDATE app_runtime_settings
      SET
        signups_enabled = ${input.signupsEnabled ?? existing.signups_enabled},
        linking_enabled = ${input.linkingEnabled ?? existing.linking_enabled},
        updated_at = NOW()
      WHERE id = 1
      RETURNING id, signups_enabled, linking_enabled, created_at, updated_at
    `;
    const nextSettings = nextSettingsRows[0];

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "app_runtime_settings.update",
      targetTable: "app_runtime_settings",
      targetId: 1,
      beforeJson: existing,
      afterJson: nextSettings
    });

    return {
      before: existing,
      after: nextSettings
    };
  });

  const relinkSummary =
    result.before.linking_enabled === false && result.after.linking_enabled === true
      ? await autoApprovePendingDataRequests(adminUserId)
      : null;

  return {
    settings: result.after,
    relinkSummary
  };
}

export async function createStaffAccount(
  adminUserId: number,
  input: {
    name: string;
    email: string;
    password: string;
    staffType: StaffType;
    branchName?: string | null;
  }
) {
  await ensureStaffAccessSchema();

  const actingAdmin = await prisma.appUser.findUnique({
    where: { id: BigInt(adminUserId) }
  });
  const actingStaffProfile = await getStaffProfileByUserId(adminUserId);

  if (!actingAdmin || actingAdmin.role !== "admin" || !actingStaffProfile) {
    throw new Error("Admin account not found.");
  }

  if (!canCreateStaffType({ staff_profile: actingStaffProfile }, input.staffType)) {
    throw new Error("You are not allowed to create this type of staff account.");
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const normalizedBranchName =
    input.staffType === "placement_cell"
      ? null
      : actingStaffProfile.staff_type === "hod"
        ? actingStaffProfile.branch_name
        : input.branchName?.trim() || null;

  if (!name) {
    throw new Error("Staff name is required.");
  }

  if (!isAllowedStaffEmail(email)) {
    throw new Error("Staff accounts must use an approved institutional email.");
  }

  if ((input.staffType === "hod" || input.staffType === "teacher") && !normalizedBranchName) {
    throw new Error("A branch is required for HOD and teacher accounts.");
  }

  const existingAppUser = await prisma.appUser.findUnique({
    where: { email }
  });

  if (existingAppUser) {
    throw new Error("An app account with this email already exists.");
  }

  const auth = getFirebaseAdminAuth();
  const firebaseUser = await auth.createUser({
    email,
    password: input.password,
    displayName: name,
    emailVerified: true,
    disabled: false
  });

  try {
    const created = await prisma.$transaction(async (tx) => {
      const staffUser = await tx.appUser.create({
        data: {
          firebaseUid: firebaseUser.uid,
          email,
          emailVerified: true,
          displayName: name,
          role: "admin"
        }
      });

      const staffProfile = await upsertStaffProfileRecord(tx, {
        appUserId: Number(staffUser.id),
        staffType: input.staffType,
        branchName: normalizedBranchName,
        status: "active",
        createdByUserId: adminUserId
      });

      await logAdminAudit(tx, {
        adminUserId,
        actionKey: "staff.create",
        targetTable: "app_users",
        targetId: staffUser.id.toString(),
        beforeJson: null,
        afterJson: {
          app_user: staffUser,
          staff_profile: staffProfile
        }
      });

      return {
        staffUser,
        staffProfile
      };
    });

    return created;
  } catch (error) {
    await auth.deleteUser(firebaseUser.uid).catch(() => undefined);
    throw error;
  }
}

export async function updateStaffProfile(
  adminUserId: number,
  targetUserId: number,
  input: {
    staffType: StaffType;
    branchName?: string | null;
    status?: "active" | "suspended";
  }
) {
  await ensureStaffAccessSchema();
  const actingStaffProfile = await getStaffProfileByUserId(adminUserId);

  if (!actingStaffProfile || actingStaffProfile.staff_type !== "main_admin") {
    throw new Error("Only the main admin can update staff access.");
  }

  const targetUser = await prisma.appUser.findUnique({
    where: { id: BigInt(targetUserId) }
  });

  if (!targetUser || targetUser.role !== "admin") {
    throw new Error("Staff account not found.");
  }

  if (isMainAdminEmail(targetUser.email)) {
    throw new Error("The main admin profile cannot be changed.");
  }

  if ((input.staffType === "hod" || input.staffType === "teacher") && !input.branchName?.trim()) {
    throw new Error("A branch is required for HOD and teacher accounts.");
  }

  return prisma.$transaction(async (tx) => {
    const beforeProfile = await tx.$queryRaw<Array<{
      app_user_id: bigint;
      staff_type: string;
      branch_name: string | null;
      status: string;
      created_by_user_id: bigint | null;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT app_user_id, staff_type, branch_name, status, created_by_user_id, created_at, updated_at
      FROM staff_profiles
      WHERE app_user_id = ${BigInt(targetUserId)}
      LIMIT 1
    `;

    const updatedProfile = await upsertStaffProfileRecord(tx, {
      appUserId: targetUserId,
      staffType: input.staffType,
      branchName: input.staffType === "placement_cell" ? null : input.branchName?.trim() || null,
      status: input.status ?? "active",
      createdByUserId: beforeProfile[0]?.created_by_user_id ? Number(beforeProfile[0].created_by_user_id) : adminUserId
    });

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "staff.update",
      targetTable: "staff_profiles",
      targetId: targetUserId,
      beforeJson: beforeProfile[0] ?? null,
      afterJson: updatedProfile
    });

    return updatedProfile;
  });
}

export async function deleteUserAccount(adminUserId: number, targetUserId: number) {
  const result = await prisma.$transaction(async (tx) => {
    const actingAdmin = await getActingAdmin(tx, adminUserId);
    const targetUser = await tx.appUser.findUnique({
      where: { id: BigInt(targetUserId) },
      include: {
        studentLink: true,
        dataRequests: true
      }
    });

    if (!targetUser) {
      throw new Error("User not found.");
    }

    if (isMainAdminEmail(targetUser.email)) {
      throw new Error("The main admin account cannot be deleted.");
    }

    if (targetUser.id === BigInt(adminUserId)) {
      throw new Error("You cannot delete your own admin account.");
    }

    if (targetUser.role === "admin") {
      if (!canManageAdminAccounts(actingAdmin)) {
        throw new Error("Only the main admin can manage admin accounts.");
      }
      const adminCount = await getAdminCount(tx);
      if (adminCount <= 1) {
        throw new Error("At least one admin account must remain.");
      }
    }

    await tx.appUser.delete({
      where: { id: targetUser.id }
    });

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "users.delete",
      targetTable: "app_users",
      targetId: targetUserId,
      beforeJson: targetUser,
      afterJson: null
    });

    return {
      cacheStudentId: targetUser.studentLink?.studentId ? Number(targetUser.studentLink.studentId) : null
    };
  });

  if (result.cacheStudentId !== null) {
    await deleteDashboardCacheForStudent(result.cacheStudentId);
  }
}

export async function updateStudentLinkRecord(
  adminUserId: number,
  linkId: number,
  input: {
    rollNo: string;
    dob: string;
    status: string;
  }
) {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.studentLink.findUnique({
      where: { id: BigInt(linkId) }
    });

    if (!existing) {
      throw new Error("Student link not found.");
    }

    const nextStatus = input.status.trim();
    const student = await resolveStudentByRollNo(tx, input.rollNo);

    let updated: Awaited<ReturnType<typeof tx.studentLink.update>> | AssignedStudentLinkResult;
    if (nextStatus === "linked") {
      if (!student) {
        throw new Error("No student record exists for the provided roll number.");
      }

      updated = await assignStudentToUser(tx, {
        appUserId: existing.appUserId,
        studentId: student.id,
        rollNo: input.rollNo,
        dob: input.dob
      });
    } else {
      updated = await tx.studentLink.update({
        where: { id: existing.id },
        data: {
          rollNo: input.rollNo,
          dob: input.dob,
          status: nextStatus,
          studentId: nextStatus === "linked" && student ? student.id : null,
          updatedAt: new Date()
        }
      });

      if (nextStatus !== "linked") {
        await ensurePendingRequest(tx, {
          appUserId: existing.appUserId,
          rollNo: input.rollNo,
          dob: input.dob
        });
      }
    }

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "student_links.update",
      targetTable: "student_links",
      targetId: linkId,
      beforeJson: existing,
      afterJson: updated
    });

    const normalizedUpdated = isAssignedStudentLinkResult(updated) ? updated.link : updated;
    const staleCacheStudentId = isAssignedStudentLinkResult(updated)
      ? updated.previousStudentId
      : existing.studentId !== null && nextStatus !== "linked"
        ? Number(existing.studentId)
        : null;

    return {
      updated: normalizedUpdated,
      staleCacheStudentId,
      cacheStudentId:
        normalizedUpdated.status === "linked" && normalizedUpdated.studentId ? Number(normalizedUpdated.studentId) : null
    };
  });

  if (result.staleCacheStudentId !== null && result.staleCacheStudentId !== result.cacheStudentId) {
    await deleteDashboardCacheForStudent(result.staleCacheStudentId);
  }

  if (result.cacheStudentId !== null) {
    await rebuildDashboardCacheForStudent(result.cacheStudentId);
  }

  return result.updated;
}

export async function deleteStudentLinkRecord(adminUserId: number, linkId: number) {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.studentLink.findUnique({
      where: { id: BigInt(linkId) }
    });

    if (!existing) {
      throw new Error("Student link not found.");
    }

    await tx.studentLink.delete({
      where: { id: existing.id }
    });

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "student_links.delete",
      targetTable: "student_links",
      targetId: linkId,
      beforeJson: existing,
      afterJson: null
    });

    return {
      cacheStudentId: existing.studentId ? Number(existing.studentId) : null
    };
  });

  if (result.cacheStudentId !== null) {
    await deleteDashboardCacheForStudent(result.cacheStudentId);
  }
}

export async function updateDataRequestRecord(
  adminUserId: number,
  requestId: number,
  input: {
    rollNo: string;
    dob: string;
    status: string;
    notes?: string | null;
    action?: "save" | "approve" | "reject";
  }
) {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.dataRequest.findUnique({
      where: { id: BigInt(requestId) }
    });

    if (!existing) {
      throw new Error("Data request not found.");
    }

    let updatedRequest = await tx.dataRequest.update({
      where: { id: existing.id },
      data: {
        rollNo: input.rollNo,
        dob: input.dob,
        status: input.action === "reject" ? "rejected" : input.status,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        updatedAt: new Date()
      }
    });

    let staleCacheStudentId: number | null = null;

    if (input.action === "approve") {
      const student = await resolveStudentByRollNo(tx, input.rollNo);
      if (!student) {
        throw new Error("Cannot approve without a matching student record.");
      }

      const linkedResult = await assignStudentToUser(tx, {
        appUserId: existing.appUserId,
        studentId: student.id,
        rollNo: input.rollNo,
        dob: input.dob,
        preserveDataRequestId: existing.id
      });
      staleCacheStudentId = linkedResult.previousStudentId;

      updatedRequest = await tx.dataRequest.update({
        where: { id: existing.id },
        data: {
          status: "approved",
          updatedAt: new Date()
        }
      });
    }

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: `data_requests.${input.action ?? "update"}`,
      targetTable: "data_requests",
      targetId: requestId,
      beforeJson: existing,
      afterJson: updatedRequest
    });

    return {
      updatedRequest,
      staleCacheStudentId,
      cacheStudentId:
        input.action === "approve" && input.rollNo
          ? Number((await resolveStudentByRollNo(tx, input.rollNo))?.id ?? 0) || null
          : null
    };
  });

  if (result.staleCacheStudentId !== null && result.staleCacheStudentId !== result.cacheStudentId) {
    await deleteDashboardCacheForStudent(result.staleCacheStudentId);
  }

  if (result.cacheStudentId !== null) {
    await rebuildDashboardCacheForStudent(result.cacheStudentId);
  }

  return result.updatedRequest;
}

export async function deleteDataRequestRecord(adminUserId: number, requestId: number) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.dataRequest.findUnique({
      where: { id: BigInt(requestId) }
    });

    if (!existing) {
      throw new Error("Data request not found.");
    }

    await tx.dataRequest.delete({
      where: { id: existing.id }
    });

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "data_requests.delete",
      targetTable: "data_requests",
      targetId: requestId,
      beforeJson: existing,
      afterJson: null
    });
  });
}

export async function attachStudentToAppUser(
  adminUserId: number,
  studentId: number,
  input: {
    appUserId: number;
    dob: string;
  }
) {
  const result = await prisma.$transaction(async (tx) => {
    const student = await tx.students.findUnique({
      where: { id: BigInt(studentId) }
    });
    const appUser = await tx.appUser.findUnique({
      where: { id: BigInt(input.appUserId) }
    });

    if (!student) {
      throw new Error("Student not found.");
    }

    if (!appUser) {
      throw new Error("App user not found.");
    }

    const linkedResult = await assignStudentToUser(tx, {
      appUserId: appUser.id,
      studentId: student.id,
      rollNo: student.roll_no,
      dob: input.dob
    });

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "students.attach_user",
      targetTable: "students",
      targetId: studentId,
      beforeJson: { student, appUserId: input.appUserId },
      afterJson: linkedResult.link
    });

    return linkedResult;
  });

  if (result.previousStudentId !== null && result.previousStudentId !== studentId) {
    await deleteDashboardCacheForStudent(result.previousStudentId);
  }

  await rebuildDashboardCacheForStudent(studentId);
  return result.link;
}

export async function detachStudentFromAppUser(adminUserId: number, studentId: number) {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.studentLink.findUnique({
      where: { studentId: BigInt(studentId) }
    });

    if (!existing) {
      throw new Error("This student is not linked to any app user.");
    }

    const updated = await tx.studentLink.update({
      where: { id: existing.id },
      data: {
        studentId: null,
        status: "pending_data",
        updatedAt: new Date()
      }
    });

    await ensurePendingRequest(tx, {
      appUserId: existing.appUserId,
      rollNo: existing.rollNo,
      dob: existing.dob
    });

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "students.detach_user",
      targetTable: "students",
      targetId: studentId,
      beforeJson: existing,
      afterJson: updated
    });

    return {
      updated,
      cacheStudentId: studentId
    };
  });

  await deleteDashboardCacheForStudent(result.cacheStudentId);
  return result.updated;
}

export async function deleteStudentRecord(adminUserId: number, studentId: number) {
  return prisma.$transaction(async (tx) => {
    const student = await tx.students.findUnique({
      where: { id: BigInt(studentId) },
      include: {
        student_links: true,
        student_metrics: true,
        result_sessions: true,
        result_snapshots: true,
        student_rankings: true
      }
    });

    if (!student) {
      throw new Error("Student not found.");
    }

    const existingLink = await tx.studentLink.findUnique({
      where: { studentId: BigInt(studentId) }
    });

    if (existingLink) {
      await tx.studentLink.update({
        where: { id: existingLink.id },
        data: {
          studentId: null,
          status: "pending_data",
          updatedAt: new Date()
        }
      });

      await ensurePendingRequest(tx, {
        appUserId: existingLink.appUserId,
        rollNo: existingLink.rollNo,
        dob: existingLink.dob
      });
    }

    await tx.students.delete({
      where: { id: BigInt(studentId) }
    });

    await logAdminAudit(tx, {
      adminUserId,
      actionKey: "students.delete",
      targetTable: "students",
      targetId: studentId,
      beforeJson: student,
      afterJson: existingLink
        ? {
            detached_link_app_user_id: existingLink.appUserId.toString(),
            resulting_status: "pending_data"
          }
        : null
    });
  });
}

function splitRankingSql(script: string) {
  const trimmed = script.trim();
  const firstStatement = "TRUNCATE TABLE student_rankings;";
  if (!trimmed.startsWith(firstStatement)) {
    throw new Error("Unexpected ranking rebuild script format.");
  }

  return {
    truncateSql: "TRUNCATE TABLE student_rankings",
    rebuildSql: trimmed.slice(firstStatement.length).trim()
  };
}

function buildPartialRankingRebuildSql(passingYear: number) {
  return `
WITH target_students AS (
  SELECT s.id AS student_id
  FROM students s
  WHERE s.passing_year = ${passingYear}
),
semester_credits(semester_no, credit) AS (
  VALUES
    (1, 22::numeric),
    (2, 22::numeric),
    (3, 23::numeric),
    (4, 21::numeric),
    (5, 23::numeric),
    (6, 21::numeric),
    (7, 19::numeric),
    (8, 16::numeric)
),
ranked_semesters AS (
  SELECT
    rs.student_id,
    sr.semester_no,
    sr.sgpa,
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
  JOIN target_students ts ON ts.student_id = rs.student_id
),
latest_semesters AS (
  SELECT
    student_id,
    semester_no,
    sgpa
  FROM ranked_semesters
  WHERE row_no = 1
),
weighted_cgpa AS (
  SELECT
    ls.student_id,
    ROUND(SUM(ls.sgpa * sc.credit) / SUM(sc.credit), 2) AS cgpa
  FROM latest_semesters ls
  JOIN semester_credits sc ON sc.semester_no = ls.semester_no
  WHERE ls.sgpa IS NOT NULL
  GROUP BY ls.student_id
),
latest_marks AS (
  SELECT DISTINCT ON (rs.student_id)
    rs.student_id,
    rs.marks_obtained
  FROM result_sessions rs
  JOIN target_students ts ON ts.student_id = rs.student_id
  ORDER BY rs.student_id, rs.created_at DESC NULLS LAST, rs.id DESC
),
student_base AS (
  SELECT
    s.id AS student_id,
    s.roll_no,
    s.name,
    s.institute_name,
    s.branch_name,
    s.course_name,
    s.passing_year,
    sm.overall_percentage,
    COALESCE(wc.cgpa, sm.cgpa) AS cgpa,
    sm.latest_sgpa,
    sm.active_backs,
    lm.marks_obtained
  FROM students s
  JOIN target_students ts ON ts.student_id = s.id
  JOIN student_metrics sm ON sm.student_id = s.id
  LEFT JOIN weighted_cgpa wc ON wc.student_id = s.id
  LEFT JOIN latest_marks lm ON lm.student_id = s.id
),
branch_percentage AS (
  SELECT
    sb.student_id,
    'branch'::varchar(16) AS scope_key,
    'percentage'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    sb.branch_name,
    sb.course_name,
    sb.passing_year,
    sb.overall_percentage AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
      ORDER BY sb.overall_percentage DESC, sb.cgpa DESC NULLS LAST, sb.active_backs ASC, sb.latest_sgpa DESC NULLS LAST, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.overall_percentage IS NOT NULL
),
batch_percentage AS (
  SELECT
    sb.student_id,
    'batch'::varchar(16) AS scope_key,
    'percentage'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    NULL::text AS branch_name,
    NULL::text AS course_name,
    sb.passing_year,
    sb.overall_percentage AS score,
    RANK() OVER (
      PARTITION BY sb.passing_year
      ORDER BY sb.overall_percentage DESC, sb.cgpa DESC NULLS LAST, sb.active_backs ASC, sb.latest_sgpa DESC NULLS LAST, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.overall_percentage IS NOT NULL
),
branch_cgpa AS (
  SELECT
    sb.student_id,
    'branch'::varchar(16) AS scope_key,
    'cgpa'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    sb.branch_name,
    sb.course_name,
    sb.passing_year,
    sb.cgpa AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
      ORDER BY sb.cgpa DESC, sb.overall_percentage DESC NULLS LAST, sb.active_backs ASC, sb.latest_sgpa DESC NULLS LAST, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.cgpa IS NOT NULL
),
batch_cgpa AS (
  SELECT
    sb.student_id,
    'batch'::varchar(16) AS scope_key,
    'cgpa'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    NULL::text AS branch_name,
    NULL::text AS course_name,
    sb.passing_year,
    sb.cgpa AS score,
    RANK() OVER (
      PARTITION BY sb.passing_year
      ORDER BY sb.cgpa DESC, sb.overall_percentage DESC NULLS LAST, sb.active_backs ASC, sb.latest_sgpa DESC NULLS LAST, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.cgpa IS NOT NULL
),
branch_latest AS (
  SELECT
    sb.student_id,
    'branch'::varchar(16) AS scope_key,
    'latest'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    sb.branch_name,
    sb.course_name,
    sb.passing_year,
    sb.latest_sgpa AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
      ORDER BY sb.latest_sgpa DESC, sb.marks_obtained DESC NULLS LAST, sb.active_backs ASC, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.latest_sgpa IS NOT NULL
),
batch_latest AS (
  SELECT
    sb.student_id,
    'batch'::varchar(16) AS scope_key,
    'latest'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    NULL::text AS branch_name,
    NULL::text AS course_name,
    sb.passing_year,
    sb.latest_sgpa AS score,
    RANK() OVER (
      PARTITION BY sb.passing_year
      ORDER BY sb.latest_sgpa DESC, sb.marks_obtained DESC NULLS LAST, sb.active_backs ASC, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.latest_sgpa IS NOT NULL
),
branch_semester_sgpa AS (
  SELECT
    ls.student_id,
    'branch'::varchar(16) AS scope_key,
    'semester_sgpa'::varchar(32) AS metric_key,
    ls.semester_no::smallint AS semester_no,
    sb.institute_name,
    sb.branch_name,
    sb.course_name,
    sb.passing_year,
    ls.sgpa AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year, ls.semester_no
      ORDER BY ls.sgpa DESC, sb.marks_obtained DESC NULLS LAST, sb.active_backs ASC, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year, ls.semester_no
    ) AS total_students
  FROM latest_semesters ls
  JOIN student_base sb ON sb.student_id = ls.student_id
  WHERE ls.sgpa IS NOT NULL
),
batch_semester_sgpa AS (
  SELECT
    ls.student_id,
    'batch'::varchar(16) AS scope_key,
    'semester_sgpa'::varchar(32) AS metric_key,
    ls.semester_no::smallint AS semester_no,
    sb.institute_name,
    NULL::text AS branch_name,
    NULL::text AS course_name,
    sb.passing_year,
    ls.sgpa AS score,
    RANK() OVER (
      PARTITION BY sb.passing_year, ls.semester_no
      ORDER BY ls.sgpa DESC, sb.marks_obtained DESC NULLS LAST, sb.active_backs ASC, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.passing_year, ls.semester_no
    ) AS total_students
  FROM latest_semesters ls
  JOIN student_base sb ON sb.student_id = ls.student_id
  WHERE ls.sgpa IS NOT NULL
)
INSERT INTO student_rankings (
  student_id,
  scope_key,
  metric_key,
  semester_no,
  institute_name,
  branch_name,
  course_name,
  passing_year,
  score,
  rank,
  total_students
)
SELECT * FROM branch_percentage
UNION ALL
SELECT * FROM batch_percentage
UNION ALL
SELECT * FROM branch_cgpa
UNION ALL
SELECT * FROM batch_cgpa
UNION ALL
SELECT * FROM branch_latest
UNION ALL
SELECT * FROM batch_latest
UNION ALL
SELECT * FROM branch_semester_sgpa
UNION ALL
SELECT * FROM batch_semester_sgpa
`.trim();
}

function parsePassingYear(value: number | undefined) {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 2000 || value > 2100) {
    throw new Error("Passing year must be a valid 4-digit year.");
  }
  return value;
}

export async function rebuildStudentRankings(
  adminUserId: number,
  options?: { passingYear?: number }
) {
  const scriptPath = path.join(process.cwd(), "scripts", "rebuild-student-rankings.sql");
  const sql = getSql();
  const passingYear = parsePassingYear(options?.passingYear);
  let snapshotRefresh: Awaited<ReturnType<typeof rebuildDashboardCachesForLinkedStudents>>;
  let affectedRows = 0;

  if (passingYear === undefined) {
    const script = await fs.readFile(scriptPath, "utf8");
    const { truncateSql, rebuildSql } = splitRankingSql(script);

    await sql.query(truncateSql);
    await sql.query(rebuildSql);
    snapshotRefresh = await rebuildDashboardCachesForLinkedStudents();
  } else {
    await sql`
      DELETE FROM student_rankings
      WHERE passing_year = ${passingYear}
    `;
    await sql.query(buildPartialRankingRebuildSql(passingYear));

    const partialRows = (await sql`
      SELECT COUNT(*)::int AS total
      FROM student_rankings
      WHERE passing_year = ${passingYear}
    `) as Array<{ total: number }>;
    affectedRows = partialRows[0]?.total ?? 0;
    snapshotRefresh = await rebuildDashboardCachesForPassingYear(passingYear);
  }

  const rows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM student_rankings
  `) as Array<{ total: number }>;
  const totalRows = rows[0]?.total ?? 0;
  if (passingYear === undefined) {
    affectedRows = totalRows;
  }

  await logAdminAudit(prisma, {
    adminUserId,
    actionKey: "rankings.rebuild",
    targetTable: "student_rankings",
    targetId: passingYear === undefined ? "all" : `passing_year:${passingYear}`,
    beforeJson: null,
    afterJson: {
      passing_year: passingYear ?? null,
      affected_rows: affectedRows,
      total_rows: totalRows,
      refreshed_app_snapshots: snapshotRefresh.rebuiltStudents
    }
  });

  return {
    passingYear: passingYear ?? null,
    affectedRows,
    totalRows,
    refreshedSnapshots: snapshotRefresh.rebuiltStudents
  };
}

export async function clearStudentDashboardCaches(adminUserId: number) {
  await clearAllDashboardCaches();
  const totalRows = await countDashboardCacheRows();

  await logAdminAudit(prisma, {
    adminUserId,
    actionKey: "dashboard_cache.clear",
    targetTable: "student_app_snapshot_cache",
    targetId: "all",
    beforeJson: null,
    afterJson: { total_rows: totalRows }
  });

  return { totalRows };
}

export async function rebuildStudentDashboardCaches(adminUserId: number) {
  const result = await rebuildDashboardCachesForLinkedStudents();
  const totalRows = await countDashboardCacheRows();

  await logAdminAudit(prisma, {
    adminUserId,
    actionKey: "dashboard_cache.rebuild",
    targetTable: "student_app_snapshot_cache",
    targetId: "linked_students",
    beforeJson: null,
    afterJson: {
      rebuilt_students: result.rebuiltStudents,
      linked_students: result.linkedStudents,
      total_rows: totalRows
    }
  });

  return {
    ...result,
    totalRows
  };
}
