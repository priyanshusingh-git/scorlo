import "server-only";

import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/lib/auth/session";
import {
  type AdminSessionUser,
  canReadStudentsAsStaff,
  getStaffProfileForAppUser,
  isMainAdminStaff
} from "@/lib/staff-access";

export async function getCurrentAdminSessionUser() {
  const user = await getCurrentSessionUser();
  const staffProfile = await getStaffProfileForAppUser(user);

  if (!user || !staffProfile || !canReadStudentsAsStaff({ staff_profile: staffProfile })) {
    return null;
  }

  return {
    ...user,
    staff_profile: staffProfile
  } satisfies AdminSessionUser;
}

export function isMainAdminUser(user: { staff_profile: { staff_type: "main_admin" | "hod" | "teacher" | "placement_cell" } }) {
  return isMainAdminStaff(user);
}

export async function requireAdminSession() {
  const user = await getCurrentAdminSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireMainAdminSession() {
  const user = await requireAdminSession();

  if (!isMainAdminUser(user)) {
    redirect("/admin/students");
  }

  return user;
}
