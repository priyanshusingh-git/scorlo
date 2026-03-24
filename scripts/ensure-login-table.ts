import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

function readEnvValue(key: string) {
  const text = fs.readFileSync(".env.local", "utf8");
  const values = Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trimStart().startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=");
        return idx === -1 ? null : [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
      })
      .filter(Boolean) as Array<[string, string]>
  );

  let value = values[key] || "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

async function main() {
  const databaseUrl = readEnvValue("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL missing in .env.local");
  }

  const sql = neon(databaseUrl);

  await sql.query(`SET lock_timeout = '5000ms'`);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id BIGSERIAL PRIMARY KEY,
      firebase_uid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      display_name TEXT,
      role VARCHAR(16) NOT NULL DEFAULT 'student',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    )
  `);

  const tables = await sql.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'app_users'
  `);

  console.log(JSON.stringify({ ok: true, tables }, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
