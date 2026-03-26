import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { getSql } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import {
  clearAllDashboardCaches,
  countDashboardCacheRows,
  deleteDashboardCacheForStudent,
  rebuildDashboardCacheForStudent,
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
    dob
  }: {
    appUserId: bigint;
    studentId: bigint;
    rollNo: string;
    dob: string;
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
      rollNo
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

export async function deleteUserAccount(adminUserId: number, targetUserId: number) {
  const result = await prisma.$transaction(async (tx) => {
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

    if (targetUser.id === BigInt(adminUserId)) {
      throw new Error("You cannot delete your own admin account.");
    }

    if (targetUser.role === "admin") {
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
        dob: input.dob
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

export async function rebuildStudentRankings(adminUserId: number) {
  const scriptPath = path.join(process.cwd(), "scripts", "rebuild-student-rankings.sql");
  const script = await fs.readFile(scriptPath, "utf8");
  const { truncateSql, rebuildSql } = splitRankingSql(script);
  const sql = getSql();

  await sql.query(truncateSql);
  await sql.query(rebuildSql);

  const rows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM student_rankings
  `) as Array<{ total: number }>;
  const totalRows = rows[0]?.total ?? 0;
  const snapshotRefresh = await rebuildDashboardCachesForLinkedStudents();

  await logAdminAudit(prisma, {
    adminUserId,
    actionKey: "rankings.rebuild",
    targetTable: "student_rankings",
    targetId: "all",
    beforeJson: null,
    afterJson: {
      total_rows: totalRows,
      refreshed_app_snapshots: snapshotRefresh.rebuiltStudents
    }
  });

  return {
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
