import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";
import { deleteDataRequestRecord, updateDataRequestRecord } from "@/lib/admin/mutations";

const bodySchema = z.object({
  rollNo: z.string().min(1),
  dob: z.string().min(1),
  status: z.string().min(1),
  notes: z.string().nullable().optional(),
  action: z.enum(["save", "approve", "reject"]).optional()
});

function getRequestId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid request id.");
  }
  return id;
}

export async function PATCH(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can manage data requests." }, { status: 403 });
  }

  try {
    const { requestId } = await context.params;
    const id = getRequestId(requestId);
    const body = bodySchema.parse(await request.json());
    await updateDataRequestRecord(admin.id, id, body);
    return jsonNoStore({ ok: true, message: "Data request updated." });
  } catch (error) {
    return jsonNoStore(
      { error: "data_request_update_failed", message: error instanceof Error ? error.message : "Unable to update request." },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ requestId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can manage data requests." }, { status: 403 });
  }

  try {
    const { requestId } = await context.params;
    const id = getRequestId(requestId);
    await deleteDataRequestRecord(admin.id, id);
    return jsonNoStore({ ok: true, message: "Data request deleted." });
  } catch (error) {
    return jsonNoStore(
      { error: "data_request_delete_failed", message: error instanceof Error ? error.message : "Unable to delete request." },
      { status: 400 }
    );
  }
}
