import "server-only";

import { getCurrentSessionUser } from "@/lib/auth/session";
import { getStudentLinkForUser } from "@/lib/queries/student-link";

export async function getCurrentUserWithLink() {
  const user = await getCurrentSessionUser();
  const link = user ? await getStudentLinkForUser(user.id) : null;

  return { user, link };
}
