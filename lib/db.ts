import "server-only";

import { neon } from "@neondatabase/serverless";
import { getServerEnv } from "@/lib/env";

let client: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (client) return client;
  const env = getServerEnv();
  client = neon(env.DATABASE_URL);
  return client;
}
