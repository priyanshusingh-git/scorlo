import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { ensureAppUserForSession } from "@/lib/queries/app-users";
import { getSessionCookieName } from "@/lib/session-cookie";

export const getCurrentSessionUser = cache(async () => {
  const cookieName = getSessionCookieName();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cookieName)?.value;

  if (!sessionCookie) return null;

  try {
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
    return await ensureAppUserForSession(decoded);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth/session] verify_session_cookie_failed", {
        cookieName,
        ...(error instanceof Error
          ? { name: error.name, message: error.message }
          : { message: "Unknown error" })
      });
    }
    return null;
  }
});

export async function requireSessionUser() {
  const user = await getCurrentSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireStudentSession() {
  const user = await requireSessionUser();

  if (user.role === "admin") {
    redirect("/admin");
  }

  return user;
}
