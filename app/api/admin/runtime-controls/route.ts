import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";
import { updateAppRuntimeSettings } from "@/lib/admin/mutations";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";

const bodySchema = z.object({
  signupsEnabled: z.boolean().optional(),
  linkingEnabled: z.boolean().optional()
});

export async function PATCH(request: Request) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can change app access controls." }, { status: 403 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    if (body.signupsEnabled === undefined && body.linkingEnabled === undefined) {
      throw new Error("No control update was provided.");
    }

    const result = await updateAppRuntimeSettings(admin.id, body);
    const autoLinkedCount = result.relinkSummary?.approvedCount ?? 0;
    const message =
      result.relinkSummary
        ? `Controls updated. ${autoLinkedCount} pending request${autoLinkedCount === 1 ? "" : "s"} were linked automatically.`
        : "Controls updated.";

    return jsonNoStore({
      ok: true,
      message,
      settings: result.settings,
      relinkSummary: result.relinkSummary
    });
  } catch (error) {
    return jsonNoStore(
      {
        error: "runtime_controls_update_failed",
        message: error instanceof Error ? error.message : "Unable to update app controls."
      },
      { status: 400 }
    );
  }
}
