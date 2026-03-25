import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdminSessionUser } from "@/lib/auth/admin";
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
    return NextResponse.json({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  try {
    const { requestId } = await context.params;
    const id = getRequestId(requestId);
    const body = bodySchema.parse(await request.json());
    await updateDataRequestRecord(admin.id, id, body);
    return NextResponse.json({ ok: true, message: "Data request updated." });
  } catch (error) {
    return NextResponse.json(
      { error: "data_request_update_failed", message: error instanceof Error ? error.message : "Unable to update request." },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ requestId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  try {
    const { requestId } = await context.params;
    const id = getRequestId(requestId);
    await deleteDataRequestRecord(admin.id, id);
    return NextResponse.json({ ok: true, message: "Data request deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "data_request_delete_failed", message: error instanceof Error ? error.message : "Unable to delete request." },
      { status: 400 }
    );
  }
}
