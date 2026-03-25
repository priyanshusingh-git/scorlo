import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdminSessionUser } from "@/lib/auth/admin";
import { attachStudentToAppUser, detachStudentFromAppUser } from "@/lib/admin/mutations";

const bodySchema = z.object({
  appUserId: z.number().int().positive(),
  dob: z.string().min(1)
});

function getStudentId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid student id.");
  }
  return id;
}

export async function POST(request: Request, context: { params: Promise<{ studentId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  try {
    const { studentId } = await context.params;
    const id = getStudentId(studentId);
    const body = bodySchema.parse(await request.json());
    await attachStudentToAppUser(admin.id, id, body);
    return NextResponse.json({ ok: true, message: "Student attached to app user." });
  } catch (error) {
    return NextResponse.json(
      { error: "student_attach_failed", message: error instanceof Error ? error.message : "Unable to attach student." },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ studentId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  try {
    const { studentId } = await context.params;
    const id = getStudentId(studentId);
    await detachStudentFromAppUser(admin.id, id);
    return NextResponse.json({ ok: true, message: "Student detached from app user." });
  } catch (error) {
    return NextResponse.json(
      { error: "student_detach_failed", message: error instanceof Error ? error.message : "Unable to detach student." },
      { status: 400 }
    );
  }
}
