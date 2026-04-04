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
  if (schemaReadyPromise) {
    await schemaReadyPromise;
    return;
  }

  schemaReadyPromise = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS app_runtime_settings (
        id INTEGER PRIMARY KEY,
        signups_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        linking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE app_runtime_settings
      ADD COLUMN IF NOT EXISTS signups_enabled BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE app_runtime_settings
      ADD COLUMN IF NOT EXISTS linking_enabled BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE app_runtime_settings
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE app_runtime_settings
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO app_runtime_settings (id)
      VALUES (${APP_RUNTIME_SETTINGS_ID})
      ON CONFLICT (id) DO NOTHING
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS app_user_access (
        app_user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        dashboard_access_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE app_user_access
      ADD COLUMN IF NOT EXISTS dashboard_access_enabled BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE app_user_access
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE app_user_access
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);
  })();

  await schemaReadyPromise;
}

export async function getAppRuntimeControls() {
  await ensureAppRuntimeControlsSchema();
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

  return toControls({
    signupsEnabled: settingsRows[0]?.signups_enabled ?? true,
    linkingEnabled: settingsRows[0]?.linking_enabled ?? true
  });
}

export async function getUserDashboardAccessEnabled(appUserId: bigint | number) {
  await ensureAppRuntimeControlsSchema();
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
