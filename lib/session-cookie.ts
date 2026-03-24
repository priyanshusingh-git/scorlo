const PROD_SESSION_COOKIE_NAME = "__session";
const DEV_SESSION_COOKIE_NAME = "scorlo_dev_session";

export function getSessionCookieName() {
  const configured = process.env.FIREBASE_SESSION_COOKIE_NAME?.trim();

  if (process.env.NODE_ENV === "production") {
    return configured || PROD_SESSION_COOKIE_NAME;
  }

  if (!configured || configured === PROD_SESSION_COOKIE_NAME) {
    return DEV_SESSION_COOKIE_NAME;
  }

  return configured;
}

export function getSessionCookieCleanupNames() {
  return Array.from(
    new Set([getSessionCookieName(), PROD_SESSION_COOKIE_NAME, DEV_SESSION_COOKIE_NAME])
  );
}
