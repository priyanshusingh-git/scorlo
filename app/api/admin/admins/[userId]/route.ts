import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";
import { updateStaffProfile } from "@/lib/admin/mutations";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";
import { STAFF_TYPES } from "@/lib/staff-access";

const bodySchema = z.object({
  staffType: z.enum(STAFF_TYPES),
  branchName: z.string().trim().optional().nullable(),
  status: z.enum(["active", "suspended"]).optional()
});

function getUserId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid staff user id.");
  }
  return id;
}

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  if (!isMainAdminUser(admin)) {
    return jsonNoStore(
      { error: "forbidden", message: "Only the main admin can update staff access." },
      { status: 403 }
    );
  }

  try {
    const body = bodySchema.parse(await request.json());
    const { userId } = await context.params;
    await updateStaffProfile(admin.id, getUserId(userId), body);
    return jsonNoStore({ ok: true, message: "Staff profile updated." });
  } catch (error) {
    return jsonNoStore(
      { error: "staff_update_failed", message: error instanceof Error ? error.message : "Unable to update staff profile." },
      { status: 400 }
    );
  }
}
