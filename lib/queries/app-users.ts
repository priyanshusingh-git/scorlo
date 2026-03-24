import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
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
  const displayName =
    typeof decoded.name === "string" && decoded.name.trim().length > 0 ? decoded.name : null;
  const now = new Date();

  const user = await prisma.appUser.upsert({
    where: { firebaseUid: decoded.uid },
    create: {
      firebaseUid: decoded.uid,
      email,
      emailVerified: Boolean(decoded.email_verified),
      displayName,
      role: "student",
      lastLoginAt: now
    },
    update: {
      email,
      emailVerified: Boolean(decoded.email_verified),
      ...(displayName ? { displayName } : {}),
      lastLoginAt: now,
      updatedAt: now
    }
  });

  return toAppUser(user);
}
