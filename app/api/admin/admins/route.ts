import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";
import { createStaffAccount } from "@/lib/admin/mutations";
import { getCurrentAdminSessionUser } from "@/lib/auth/admin";
import { STAFF_TYPES } from "@/lib/staff-access";

const bodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  staffType: z.enum(STAFF_TYPES),
  branchName: z.string().trim().optional().nullable()
});

export async function POST(request: Request) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    await createStaffAccount(admin.id, body);
    return jsonNoStore({ ok: true, message: "Staff account created." });
  } catch (error) {
    return jsonNoStore(
      { error: "staff_create_failed", message: error instanceof Error ? error.message : "Unable to create staff account." },
      { status: 400 }
    );
  }
}
