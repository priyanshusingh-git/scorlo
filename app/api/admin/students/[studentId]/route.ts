import { jsonNoStore } from "@/lib/api-response";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";
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
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can delete student records." }, { status: 403 });
  }

  try {
    const { studentId } = await context.params;
    const id = getStudentId(studentId);
    await deleteStudentRecord(admin.id, id);
    return jsonNoStore({ ok: true, message: "Student academic record deleted." });
  } catch (error) {
    return jsonNoStore(
      { error: "student_delete_failed", message: error instanceof Error ? error.message : "Unable to delete student." },
      { status: 400 }
    );
  }
}
