import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT
    schemaname AS schema,
    tablename AS table,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
    pg_total_relation_size(schemaname || '.' || tablename) AS total_bytes,
    pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS data_size,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename) - pg_relation_size(schemaname || '.' || tablename)) AS index_size
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
`;

console.log("\n📊 Neon Database — Table Sizes (largest first)\n");
console.log("Table".padEnd(40) + "Total".padEnd(12) + "Data".padEnd(12) + "Indexes");
console.log("─".repeat(76));

for (const row of rows) {
  console.log(
    row.table.padEnd(40) +
    row.total_size.padEnd(12) +
    row.data_size.padEnd(12) +
    row.index_size
  );
}

const totalBytes = rows.reduce((sum, r) => sum + Number(r.total_bytes), 0);
console.log("─".repeat(76));
console.log(`Total: ${(totalBytes / 1024 / 1024).toFixed(2)} MB across ${rows.length} tables\n`);
