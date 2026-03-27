import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { MAIN_ADMIN_NAME, isMainAdminEmail } from "@/lib/admin/constants";
import { prisma } from "@/lib/prisma";

export type AppUser = {
  id: number;
  firebase_uid: string;
  email: string;
  email_verified: boolean;
  display_name: string | null;
  role: "student" | "admin";
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

function toAppUser(user: {
  id: bigint;
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}): AppUser {
  return {
    id: Number(user.id),
    firebase_uid: user.firebaseUid,
    email: user.email,
    email_verified: user.emailVerified,
    display_name: user.displayName,
    role: user.role as AppUser["role"],
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
    last_login_at: user.lastLoginAt?.toISOString() ?? null
  };
}

export async function ensureAppUserForSession(decoded: DecodedIdToken) {
  const email = decoded.email ?? "";
  const isMainAdmin = isMainAdminEmail(email);
  const displayName =
    typeof decoded.name === "string" && decoded.name.trim().length > 0 ? decoded.name : null;
  const normalizedDisplayName = displayName ?? (isMainAdmin ? MAIN_ADMIN_NAME : null);
  const now = new Date();

  // Try to find the user first to avoid unnecessary writes
  const existingUser = await prisma.appUser.findUnique({
    where: { firebaseUid: decoded.uid }
  });

  if (existingUser) {
    const lastLogin = existingUser.lastLoginAt;
    // Only update login timestamp if it's been more than 1 hour or critical data changed
      const needsUpdate =
      !lastLogin ||
      now.getTime() - lastLogin.getTime() > 1000 * 60 * 60 ||
      existingUser.email !== email ||
      existingUser.displayName !== normalizedDisplayName ||
      existingUser.emailVerified !== Boolean(decoded.email_verified);

    if (needsUpdate) {
      const updatedUser = await prisma.appUser.update({
        where: { id: existingUser.id },
        data: {
          email,
          emailVerified: Boolean(decoded.email_verified),
          displayName: normalizedDisplayName ?? existingUser.displayName,
          lastLoginAt: now,
          updatedAt: now
        }
      });
      return toAppUser(updatedUser);
    }

    return toAppUser(existingUser);
  }

  // Fallback to creation if not found
  const newUser = await prisma.appUser.create({
    data: {
      firebaseUid: decoded.uid,
      email,
      emailVerified: Boolean(decoded.email_verified),
      displayName: normalizedDisplayName,
      role: isMainAdmin ? "admin" : "student",
      lastLoginAt: now
    }
  });

  return toAppUser(newUser);
}
