import "server-only";

import { getSql } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { deleteDashboardCacheForStudent, rebuildDashboardCacheForStudent } from "@/lib/queries/dashboard";

export type StudentLinkState = {
  student_link_id: number | null;
  status: "linked" | "pending_data" | "rejected" | null;
  roll_no: string | null;
  student_id: number | null;
};

export type LinkStudentResult = {
  link: StudentLinkState;
  message: string;
};

export class StudentLinkConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentLinkConflictError";
  }
}

function toStudentLinkState(link: {
  id: bigint;
  status: string;
  rollNo: string;
  studentId: bigint | null;
}): StudentLinkState {
  return {
    student_link_id: Number(link.id),
    status: link.status as StudentLinkState["status"],
    roll_no: link.rollNo,
    student_id: link.studentId === null ? null : Number(link.studentId)
  };
}

async function findStudentIdByRollNo(rollNo: string) {
  const sql = getSql();
  const studentRows = (await sql`
    SELECT id
    FROM students
    WHERE roll_no = ${rollNo}
    LIMIT 1
  `) as { id: number }[];

  return studentRows[0]?.id ?? null;
}

export async function getStudentLinkForUser(appUserId: number) {
  const link = await prisma.studentLink.findUnique({
    where: { appUserId: BigInt(appUserId) },
    select: {
      id: true,
      status: true,
      rollNo: true,
      studentId: true
    }
  });

  if (!link) return null;

  if (link.status !== "linked") {
    return toStudentLinkState(link);
  }

  if (link.studentId !== null) {
    return toStudentLinkState(link);
  }

  const studentId = await findStudentIdByRollNo(link.rollNo);
  if (studentId === null) {
    return toStudentLinkState(link);
  }

  const existingStudentLink = await prisma.studentLink.findUnique({
    where: { studentId: BigInt(studentId) },
    select: { appUserId: true }
  });

  if (existingStudentLink && existingStudentLink.appUserId !== BigInt(appUserId)) {
    return toStudentLinkState(link);
  }

  const updatedLink = await prisma.studentLink.update({
    where: { appUserId: BigInt(appUserId) },
    data: {
      studentId: BigInt(studentId),
      status: "linked",
      updatedAt: new Date()
    },
    select: {
      id: true,
      status: true,
      rollNo: true,
      studentId: true
    }
  });

  await prisma.dataRequest.deleteMany({
    where: {
      appUserId: BigInt(appUserId),
      rollNo: link.rollNo,
      status: "pending"
    }
  });

  await rebuildDashboardCacheForStudent(studentId);

  return toStudentLinkState(updatedLink);
}

export async function linkStudentRecord({
  appUserId,
  rollNo,
  dob
}: {
  appUserId: number;
  rollNo: string;
  dob: string;
}): Promise<LinkStudentResult> {
  const existingLink = await prisma.studentLink.findUnique({
    where: { appUserId: BigInt(appUserId) },
    select: {
      studentId: true
    }
  });

  const studentIdValue = await findStudentIdByRollNo(rollNo);
  const student = studentIdValue === null ? null : { id: studentIdValue };
  const status = student ? "linked" : "pending_data";
  const studentId = student ? BigInt(student.id) : null;

  const existingClaim = await prisma.studentLink.findUnique({
    where: { rollNo },
    select: { appUserId: true }
  });

  if (existingClaim && existingClaim.appUserId !== BigInt(appUserId)) {
    throw new StudentLinkConflictError("This roll number is already linked to another account.");
  }

  if (studentId !== null) {
    const existingStudentLink = await prisma.studentLink.findUnique({
      where: { studentId },
      select: { appUserId: true }
    });

    if (existingStudentLink && existingStudentLink.appUserId !== BigInt(appUserId)) {
      throw new StudentLinkConflictError("This student record is already linked to another account.");
    }
  }

  const now = new Date();
  const link = await prisma.studentLink.upsert({
    where: { appUserId: BigInt(appUserId) },
    create: {
      appUserId: BigInt(appUserId),
      studentId,
      rollNo,
      dob,
      status
    },
    update: {
      studentId,
      rollNo,
      dob,
      status,
      updatedAt: now
    },
    select: {
      id: true,
      status: true,
      rollNo: true,
      studentId: true
    }
  });

  const staleCacheStudentId =
    existingLink?.studentId !== null &&
    existingLink?.studentId !== undefined &&
    Number(existingLink.studentId) !== (student?.id ?? null)
      ? Number(existingLink.studentId)
      : student === null && existingLink?.studentId
        ? Number(existingLink.studentId)
        : null;

  if (!student) {
    const existingPendingRequest = await prisma.dataRequest.findFirst({
      where: {
        appUserId: BigInt(appUserId),
        rollNo,
        status: "pending"
      },
      select: { id: true }
    });

    if (!existingPendingRequest) {
      await prisma.dataRequest.create({
        data: {
          appUserId: BigInt(appUserId),
          rollNo,
          dob,
          status: "pending"
        }
      });
    }
  }

  let message = "Your account is under verification from the admin.";
  if (staleCacheStudentId !== null) {
    await deleteDashboardCacheForStudent(staleCacheStudentId);
  }

  if (student) {
    message = "Academic record linked successfully.";
    await rebuildDashboardCacheForStudent(student.id);
  } else {
    message =
      "We could not find a matching student record for this roll number. Your account is under admin verification.";
  }

  return {
    link: toStudentLinkState(link),
    message
  };
}
