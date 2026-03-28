import "server-only";

import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  scope?: string;
}

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

let rateLimitSchemaPromise: Promise<void> | null = null;

async function ensureRateLimitTable() {
  if (!rateLimitSchemaPromise) {
    rateLimitSchemaPromise = (async () => {
      const sql = getSql();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS auth_rate_limits (
          scope_key VARCHAR(64) NOT NULL,
          identifier_hash CHAR(64) NOT NULL,
          request_count INTEGER NOT NULL,
          reset_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (scope_key, identifier_hash)
        )
      `);
      await sql.query(`
        CREATE INDEX IF NOT EXISTS ix_auth_rate_limits_reset_at
        ON auth_rate_limits(reset_at)
      `);
    })().catch((error) => {
      rateLimitSchemaPromise = null;
      throw error;
    });
  }

  await rateLimitSchemaPromise;
}

function hashIdentifier(identifier: string) {
  return createHash("sha256").update(identifier).digest("hex");
}

export async function rateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  await ensureRateLimitTable();

  const scopeKey = config.scope?.trim() || "global";
  const normalizedIdentifier = identifier.trim() || "anonymous";
  const identifierHash = hashIdentifier(normalizedIdentifier);
  const resetAtMs = Date.now() + config.windowMs;
  const sql = getSql();

  const rows = (await sql`
    INSERT INTO auth_rate_limits (
      scope_key,
      identifier_hash,
      request_count,
      reset_at
    )
    VALUES (
      ${scopeKey},
      ${identifierHash},
      1,
      to_timestamp(${resetAtMs / 1000})
    )
    ON CONFLICT (scope_key, identifier_hash)
    DO UPDATE SET
      request_count = CASE
        WHEN auth_rate_limits.reset_at <= NOW() THEN 1
        ELSE auth_rate_limits.request_count + 1
      END,
      reset_at = CASE
        WHEN auth_rate_limits.reset_at <= NOW() THEN to_timestamp(${resetAtMs / 1000})
        ELSE auth_rate_limits.reset_at
      END,
      updated_at = NOW()
    RETURNING
      request_count::int AS request_count,
      (EXTRACT(EPOCH FROM reset_at) * 1000)::bigint AS reset_ms
  `) as Array<{
    request_count: number;
    reset_ms: string | number | bigint;
  }>;

  const row = rows[0];
  const requestCount = row?.request_count ?? 1;
  const reset =
    typeof row?.reset_ms === "bigint"
      ? Number(row.reset_ms)
      : typeof row?.reset_ms === "string"
        ? Number.parseInt(row.reset_ms, 10)
        : Number(row?.reset_ms ?? resetAtMs);

  return {
    success: requestCount <= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - requestCount),
    reset
  };
}
