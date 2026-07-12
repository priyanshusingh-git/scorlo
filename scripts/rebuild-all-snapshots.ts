import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
try {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    exports: {},
    filename: serverOnlyPath,
    loaded: true,
    parent: null,
    children: []
  } as any;
} catch (e) {
  // Ignored if server-only is not resolvable
}

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Helper to manually parse .env.local without requiring external dotenv dependency
function loadEnv() {
  const filepath = resolve(process.cwd(), ".env.local");
  if (!existsSync(filepath)) {
    console.warn("⚠️  .env.local not found. Relying on system environment variables.");
    return;
  }

  const lines = readFileSync(filepath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

// Load env variables
loadEnv();

import { getSql } from "@/lib/db";
import { rebuildDashboardCacheForStudent } from "@/lib/queries/dashboard";

async function main() {
  const sql = getSql();

  console.log("🔍 Fetching all students from the database...");
  const students = (await sql`
    SELECT id::int AS id, roll_no, name
    FROM students
    ORDER BY id ASC
  `) as Array<{ id: number; roll_no: string; name: string | null }>;

  console.log(`📋 Found ${students.length} student records.`);
  if (students.length === 0) {
    console.log("No student records found in the database. Exiting.");
    return;
  }

  console.log("⚡ Building dashboard snapshots for all students...");
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const progress = `[${i + 1}/${students.length}]`;
    const label = `${student.name || "Unknown"} (Roll: ${student.roll_no})`;

    try {
      // Rebuilds the cache for this student
      await rebuildDashboardCacheForStudent(student.id);
      successCount++;
      console.log(`${progress} ✅ Pre-built snapshot for: ${label}`);
    } catch (error) {
      failureCount++;
      console.error(`${progress} ❌ Failed to build snapshot for ${label}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log("\n✨ Snapshot Cache Pre-build Completed!");
  console.log(`──────────────────────────────────────`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed:  ${failureCount}`);
  console.log(`📊 Total:   ${students.length}\n`);
}

main().catch((error) => {
  console.error("Fatal error during execution:", error);
  process.exit(1);
});
