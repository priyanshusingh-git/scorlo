import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { ensureAppUserForSession } from "@/lib/queries/app-users";
import { getSessionCookieCleanupNames, getSessionCookieName } from "@/lib/session-cookie";
import { rateLimit } from "@/lib/rate-limiter";

const sessionSchema = z.object({
  idToken: z.string().min(1)
});

function logAuthDebug(step: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[auth/session]", step, details ?? {});
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return { message: "Unknown error" };
}

export async function POST(request: Request) {
  try {
    const head = await headers();
    const ip = head.get("x-forwarded-for") || head.get("x-real-ip") || "anonymous";

    // Enforce rate limit: 10 attempts per minute (60,000ms)
    const limit = rateLimit(ip, { limit: 10, windowMs: 60000 });
    if (!limit.success) {
      logAuthDebug("rate_limit_exceeded", { ip });
      return NextResponse.json(
        { error: "too_many_requests", message: "Too many login attempts. Please try again after a minute." },
        { status: 429 }
      );
    }

    const body = sessionSchema.parse(await request.json());
    logAuthDebug("request_received", { idTokenLength: body.idToken.length });

    const env = getServerEnv();
    logAuthDebug("server_env_loaded", {
      cookieName: getSessionCookieName(),
      firebaseProjectId: env.FIREBASE_PROJECT_ID
    });

    const auth = getFirebaseAdminAuth();
    const sessionCookieName = getSessionCookieName();

    const decoded = await auth.verifyIdToken(body.idToken, true);
    const email = decoded.email?.toLowerCase() || "";

    logAuthDebug("id_token_verified", {
      uid: decoded.uid,
      email: email,
      emailVerified: Boolean(decoded.email_verified)
    });

    if (!email.endsWith("@glbitm.ac.in") && !email.endsWith("@scorlo.in")) {
      logAuthDebug("domain_not_allowed", { uid: decoded.uid, email });
      return NextResponse.json(
        { error: "domain_restricted", message: "This email domain is not authorized." },
        { status: 403 }
      );
    }

    if (!decoded.email_verified) {
      logAuthDebug("email_not_verified", { uid: decoded.uid, email: decoded.email ?? null });
      return NextResponse.json(
        { error: "email_not_verified", message: "Verify your email address before signing in." },
        { status: 403 }
      );
    }

    const expiresIn = 1000 * 60 * 60 * 24 * 5;
    const sessionCookie = await auth.createSessionCookie(body.idToken, { expiresIn });
    logAuthDebug("session_cookie_created", {
      uid: decoded.uid,
      cookieName: sessionCookieName,
      expiresInSeconds: expiresIn / 1000
    });

    const appUser = await ensureAppUserForSession(decoded);
    logAuthDebug("app_user_upserted", {
      uid: decoded.uid,
      appUserId: appUser?.id ?? null,
      email: appUser?.email ?? null
    });

    const cookieStore = await cookies();
    for (const cookieName of getSessionCookieCleanupNames()) {
      cookieStore.delete(cookieName);
    }

    cookieStore.set(sessionCookieName, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000
    });
    logAuthDebug("cookie_set", { cookieName: sessionCookieName, uid: decoded.uid });

    return NextResponse.json({
      ok: true,
      user: appUser,
      redirectTo: appUser.role === "admin" ? "/admin" : "/"
    });
  } catch (error) {
    console.error("[auth/session] failed", getErrorDetails(error));

    const message =
      process.env.NODE_ENV === "production"
        ? "Unable to create a secure session."
        : error instanceof Error
          ? error.message
          : "Unable to create a secure session.";

    return NextResponse.json(
      { error: "session_creation_failed", message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();

  for (const cookieName of getSessionCookieCleanupNames()) {
    cookieStore.delete(cookieName);
  }

  logAuthDebug("session_deleted");

  return NextResponse.json({ ok: true });
}
