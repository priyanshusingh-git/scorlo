import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";
import { deleteStudentLinkRecord, updateStudentLinkRecord } from "@/lib/admin/mutations";

const bodySchema = z.object({
  rollNo: z.string().min(1),
  dob: z.string().min(1),
  status: z.string().min(1)
});

function getLinkId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid link id.");
  }
  return id;
}

export async function PATCH(request: Request, context: { params: Promise<{ linkId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can manage student links." }, { status: 403 });
  }

  try {
    const { linkId } = await context.params;
    const id = getLinkId(linkId);
    const body = bodySchema.parse(await request.json());
    await updateStudentLinkRecord(admin.id, id, body);
    return jsonNoStore({ ok: true, message: "Student link updated." });
  } catch (error) {
    return jsonNoStore(
      { error: "link_update_failed", message: error instanceof Error ? error.message : "Unable to update student link." },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ linkId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can manage student links." }, { status: 403 });
  }

  try {
    const { linkId } = await context.params;
    const id = getLinkId(linkId);
    await deleteStudentLinkRecord(admin.id, id);
    return jsonNoStore({ ok: true, message: "Student link deleted." });
  } catch (error) {
    return jsonNoStore(
      { error: "link_delete_failed", message: error instanceof Error ? error.message : "Unable to delete student link." },
      { status: 400 }
    );
  }
}
