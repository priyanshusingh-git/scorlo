import "server-only";

import { getSql } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export type AppRuntimeControls = {
  signupsEnabled: boolean;
  linkingEnabled: boolean;
};

const APP_RUNTIME_SETTINGS_ID = 1;

let schemaReadyPromise: Promise<void> | null = null;

function toControls(settings: {
  signupsEnabled: boolean;
  linkingEnabled: boolean;
}): AppRuntimeControls {
  return {
    signupsEnabled: settings.signupsEnabled,
    linkingEnabled: settings.linkingEnabled
  };
}

export async function ensureAppRuntimeControlsSchema() {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (schemaReadyPromise) {
    await schemaReadyPromise;
    return;
  }

  schemaReadyPromise = (async () => {
    // Schema is managed statically via Prisma. No-op to avoid database DDL overhead.
  })();
  return schemaReadyPromise;
}

let cachedControls: AppRuntimeControls | null = null;
let controlsCacheExpiry = 0;

export async function getAppRuntimeControls() {
  const now = Date.now();
  if (cachedControls && now < controlsCacheExpiry) {
    return cachedControls;
  }

  const sql = getSql();
  const settingsRows = (await sql`
    SELECT signups_enabled, linking_enabled
    FROM app_runtime_settings
    WHERE id = ${APP_RUNTIME_SETTINGS_ID}
    LIMIT 1
  `) as Array<{
    signups_enabled: boolean;
    linking_enabled: boolean;
  }>;

  const controls = toControls({
    signupsEnabled: settingsRows[0]?.signups_enabled ?? true,
    linkingEnabled: settingsRows[0]?.linking_enabled ?? true
  });

  cachedControls = controls;
  controlsCacheExpiry = now + 30000; // 30 seconds

  return controls;
}

export async function getUserDashboardAccessEnabled(appUserId: bigint | number) {
  const sql = getSql();
  const normalizedAppUserId = typeof appUserId === "bigint" ? appUserId : BigInt(appUserId);

  const accessRows = (await sql`
    SELECT dashboard_access_enabled
    FROM app_user_access
    WHERE app_user_id = ${normalizedAppUserId}
    LIMIT 1
  `) as Array<{
    dashboard_access_enabled: boolean;
  }>;

  return accessRows[0]?.dashboard_access_enabled ?? true;
}
