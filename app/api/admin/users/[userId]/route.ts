import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdminSessionUser } from "@/lib/auth/admin";
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
    return NextResponse.json({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  try {
    const { userId } = await context.params;
    const id = getUserId({ userId });
    const body = bodySchema.parse(await request.json());
    await updateUserRole(admin.id, id, body.role);
    return NextResponse.json({ ok: true, message: "Role updated." });
  } catch (error) {
    return NextResponse.json(
      { error: "user_update_failed", message: error instanceof Error ? error.message : "Unable to update user." },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ userId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  try {
    const { userId } = await context.params;
    const id = getUserId({ userId });
    await deleteUserAccount(admin.id, id);
    return NextResponse.json({ ok: true, message: "User deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "user_delete_failed", message: error instanceof Error ? error.message : "Unable to delete user." },
      { status: 400 }
    );
  }
}
