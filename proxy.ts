import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookieCleanupNames, getSessionCookieName } from "@/lib/session-cookie";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  );
}

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  for (const cookieName of getSessionCookieCleanupNames()) {
    response.cookies.delete(cookieName);
  }

  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(getSessionCookieName())?.value;
  const hasSession = Boolean(sessionCookie);

  if (!hasSession && !isPublicPath(pathname)) {
    return buildLoginRedirect(request);
  }

  const response = NextResponse.next();

  if (hasSession && !isPublicPath(pathname)) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|.*\\..*).*)"]
};
