import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

console.log("⏳ Dropping raw_html column from result_snapshots...\n");

// Check current size before
const before = await sql`
  SELECT pg_size_pretty(pg_total_relation_size('result_snapshots')) AS total_size
`;
console.log(`Before: ${before[0].total_size}`);

// Drop the column
await sql`ALTER TABLE result_snapshots DROP COLUMN IF EXISTS raw_html`;
console.log("✅ Column dropped.");

// VACUUM to reclaim space (Neon supports this)
console.log("⏳ Running VACUUM FULL to reclaim disk space...");
await sql`VACUUM FULL result_snapshots`;
console.log("✅ VACUUM FULL complete.");

// Check size after
const after = await sql`
  SELECT pg_size_pretty(pg_total_relation_size('result_snapshots')) AS total_size
`;
console.log(`After: ${after[0].total_size}`);

console.log("\n🎉 Done!");
