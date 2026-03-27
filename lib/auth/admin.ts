import "server-only";

import { redirect } from "next/navigation";
import { isMainAdminEmail } from "@/lib/admin/constants";
import { getCurrentSessionUser } from "@/lib/auth/session";

export async function getCurrentAdminSessionUser() {
  const user = await getCurrentSessionUser();
  return user?.role === "admin" ? user : null;
}

export function isMainAdminUser(user: { email: string }) {
  return isMainAdminEmail(user.email);
}

export async function requireAdminSession() {
  const user = await getCurrentSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
}

export async function requireMainAdminSession() {
  const user = await requireAdminSession();

  if (!isMainAdminUser(user)) {
    redirect("/admin");
  }

  return user;
}
