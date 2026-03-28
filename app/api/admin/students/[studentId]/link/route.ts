import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";
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
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can attach students." }, { status: 403 });
  }

  try {
    const { studentId } = await context.params;
    const id = getStudentId(studentId);
    const body = bodySchema.parse(await request.json());
    await attachStudentToAppUser(admin.id, id, body);
    return jsonNoStore({ ok: true, message: "Student attached to app user." });
  } catch (error) {
    return jsonNoStore(
      { error: "student_attach_failed", message: error instanceof Error ? error.message : "Unable to attach student." },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ studentId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can detach students." }, { status: 403 });
  }

  try {
    const { studentId } = await context.params;
    const id = getStudentId(studentId);
    await detachStudentFromAppUser(admin.id, id);
    return jsonNoStore({ ok: true, message: "Student detached from app user." });
  } catch (error) {
    return jsonNoStore(
      { error: "student_detach_failed", message: error instanceof Error ? error.message : "Unable to detach student." },
      { status: 400 }
    );
  }
}
