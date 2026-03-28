import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";
import { createAdminAccount } from "@/lib/admin/mutations";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";

const bodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  if (!isMainAdminUser(admin)) {
    return jsonNoStore(
      { error: "forbidden", message: "Only the main admin can create admin accounts." },
      { status: 403 }
    );
  }

  try {
    const body = bodySchema.parse(await request.json());
    await createAdminAccount(admin.id, body);
    return jsonNoStore({ ok: true, message: "Admin account created." });
  } catch (error) {
    return jsonNoStore(
      { error: "admin_create_failed", message: error instanceof Error ? error.message : "Unable to create admin." },
      { status: 400 }
    );
  }
}
