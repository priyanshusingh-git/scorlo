import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getServerEnv } from "@/lib/env";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { ensureAppUserForSession, SignupsDisabledError } from "@/lib/queries/app-users";
import { getStaffProfileForAppUser } from "@/lib/staff-access";
import { getSessionCookieCleanupNames, getSessionCookieName } from "@/lib/session-cookie";
import { rateLimit } from "@/lib/rate-limiter";

const sessionSchema = z.object({
  idToken: z.string().min(1)
});

const RECENT_SIGN_IN_WINDOW_MS = 5 * 60 * 1000;

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

function isInvalidFirebaseTokenError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("decoding firebase id token failed")
    || message.includes("verifyidtoken() expects an id token")
    || message.includes("firebase id token has expired")
    || message.includes("id token has expired")
    || message.includes("firebase id token has invalid signature")
    || message.includes("argument passed to verifyidtoken")
  );
}

export async function POST(request: Request) {
  try {
    const head = await headers();
    const forwardedFor = head.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || head.get("x-real-ip") || "anonymous";

    // Enforce rate limit: 10 attempts per minute (60,000ms)
    const limit = await rateLimit(ip, {
      scope: "auth_session_create",
      limit: 10,
      windowMs: 60000
    });
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
    const authTimeMs =
      typeof decoded.auth_time === "number" ? decoded.auth_time * 1000 : Number.NaN;

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

    if (!Number.isFinite(authTimeMs) || Date.now() - authTimeMs > RECENT_SIGN_IN_WINDOW_MS) {
      logAuthDebug("stale_sign_in", { uid: decoded.uid, email });
      return NextResponse.json(
        {
          error: "recent_login_required",
          message: "Your sign-in is too old. Please enter your credentials again."
        },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const appUser = await ensureAppUserForSession(decoded);
    logAuthDebug("app_user_upserted", {
      uid: decoded.uid,
      appUserId: appUser?.id ?? null,
      email: appUser?.email ?? null
    });

    if (appUser.role === "student" && !appUser.dashboard_access_enabled) {
      return NextResponse.json(
        {
          error: "dashboard_access_disabled",
          message: "Your dashboard access has been disabled by the admin."
        },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (appUser.role === "admin") {
      const staffProfile = await getStaffProfileForAppUser(appUser);
      if (!staffProfile || staffProfile.status !== "active") {
        return NextResponse.json(
          {
            error: "admin_access_disabled",
            message: "Your admin access is inactive. Contact the main admin."
          },
          { status: 403, headers: { "Cache-Control": "no-store" } }
        );
      }
    }

    const expiresIn = 1000 * 60 * 60 * 24 * 5;
    const sessionCookie = await auth.createSessionCookie(body.idToken, { expiresIn });
    logAuthDebug("session_cookie_created", {
      uid: decoded.uid,
      cookieName: sessionCookieName,
      expiresInSeconds: expiresIn / 1000
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
      maxAge: expiresIn / 1000,
      priority: "high"
    });
    logAuthDebug("cookie_set", { cookieName: sessionCookieName, uid: decoded.uid });

    return NextResponse.json(
      {
        ok: true,
        user: appUser,
        redirectTo: appUser.role === "admin" ? "/admin" : "/"
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_request", message: "Invalid session request." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (isInvalidFirebaseTokenError(error)) {
      return NextResponse.json(
        { error: "invalid_token", message: "Authentication expired. Please sign in again." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (error instanceof SignupsDisabledError) {
      return NextResponse.json(
        { error: "signups_disabled", message: error.message },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    console.error("[auth/session] failed", getErrorDetails(error));

    const message =
      process.env.NODE_ENV === "production"
        ? "Unable to create a secure session."
        : error instanceof Error
          ? error.message
          : "Unable to create a secure session.";

    return NextResponse.json(
      { error: "session_creation_failed", message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();

  for (const cookieName of getSessionCookieCleanupNames()) {
    cookieStore.delete(cookieName);
  }

  logAuthDebug("session_deleted");

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
