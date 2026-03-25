import { NextResponse } from "next/server";
import { getCurrentAdminSessionUser } from "@/lib/auth/admin";
import { deleteStudentRecord } from "@/lib/admin/mutations";

function getStudentId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid student id.");
  }
  return id;
}

export async function DELETE(_: Request, context: { params: Promise<{ studentId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  try {
    const { studentId } = await context.params;
    const id = getStudentId(studentId);
    await deleteStudentRecord(admin.id, id);
    return NextResponse.json({ ok: true, message: "Student academic record deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "student_delete_failed", message: error instanceof Error ? error.message : "Unable to delete student." },
      { status: 400 }
    );
  }
}
