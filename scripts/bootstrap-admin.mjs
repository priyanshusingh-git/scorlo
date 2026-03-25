import fs from "node:fs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const text = fs.readFileSync(filePath, "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trimStart().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        if (index === -1) return null;
        const key = line.slice(0, index).trim();
        let value = line.slice(index + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [key, value];
      })
      .filter(Boolean)
  );
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const envFromFile = readEnvFile(".env.local");
for (const [key, value] of Object.entries(envFromFile)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const email = getArg("--email") || process.env.ADMIN_EMAIL;
const password = getArg("--password") || process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Usage: node scripts/bootstrap-admin.mjs --email <email> --password <password>");
  process.exit(1);
}

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error("Firebase admin env vars are missing.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const firebaseApp =
  getApps()[0] ||
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });

const auth = getAuth(firebaseApp);
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL })
});

try {
  let firebaseUser;

  try {
    firebaseUser = await auth.getUserByEmail(email);
    firebaseUser = await auth.updateUser(firebaseUser.uid, {
      email,
      password,
      emailVerified: true,
      displayName: "Scorlo Admin",
      disabled: false
    });
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      firebaseUser = await auth.createUser({
        email,
        password,
        emailVerified: true,
        displayName: "Scorlo Admin"
      });
    } else {
      throw error;
    }
  }

  const existingByUid = await prisma.appUser.findUnique({
    where: { firebaseUid: firebaseUser.uid }
  });
  const existingByEmail = await prisma.appUser.findUnique({
    where: { email }
  });
  const existing = existingByUid || existingByEmail;

  const appUser = existing
    ? await prisma.appUser.update({
        where: { id: existing.id },
        data: {
          firebaseUid: firebaseUser.uid,
          email,
          emailVerified: true,
          displayName: "Scorlo Admin",
          role: "admin",
          updatedAt: new Date()
        }
      })
    : await prisma.appUser.create({
        data: {
          firebaseUid: firebaseUser.uid,
          email,
          emailVerified: true,
          displayName: "Scorlo Admin",
          role: "admin"
        }
      });

  console.log(
    JSON.stringify(
      {
        ok: true,
        firebaseUid: firebaseUser.uid,
        appUserId: appUser.id.toString(),
        email,
        role: appUser.role
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
