import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";
import { deleteUserAccount, updateUserRole } from "@/lib/admin/mutations";

const bodySchema = z.object({
  role: z.enum(["student", "admin"])
});

function getUserId(params: { userId: string }) {
  const id = Number(params.userId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid user id.");
  }
  return id;
}

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can manage users." }, { status: 403 });
  }

  try {
    const { userId } = await context.params;
    const id = getUserId({ userId });
    const body = bodySchema.parse(await request.json());
    await updateUserRole(admin.id, id, body.role);
    return jsonNoStore({ ok: true, message: "Role updated." });
  } catch (error) {
    return jsonNoStore(
      { error: "user_update_failed", message: error instanceof Error ? error.message : "Unable to update user." },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ userId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can manage users." }, { status: 403 });
  }

  try {
    const { userId } = await context.params;
    const id = getUserId({ userId });
    await deleteUserAccount(admin.id, id);
    return jsonNoStore({ ok: true, message: "User deleted." });
  } catch (error) {
    return jsonNoStore(
      { error: "user_delete_failed", message: error instanceof Error ? error.message : "Unable to delete user." },
      { status: 400 }
    );
  }
}
