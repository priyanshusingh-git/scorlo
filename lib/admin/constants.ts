export const MAIN_ADMIN_EMAIL = "admin@scorlo.in";
export const MAIN_ADMIN_NAME = "Main Admin";

export function isMainAdminEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase() === MAIN_ADMIN_EMAIL;
}
