import "server-only";

import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/lib/auth/session";

export async function getCurrentAdminSessionUser() {
  const user = await getCurrentSessionUser();
  return user?.role === "admin" ? user : null;
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
