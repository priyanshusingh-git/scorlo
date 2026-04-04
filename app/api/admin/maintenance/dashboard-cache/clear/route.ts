import { jsonNoStore } from "@/lib/api-response";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";
import { clearStudentDashboardCaches } from "@/lib/admin/mutations";

export async function POST() {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore(
      { error: "unauthorized", message: "Admin session required." },
      { status: 401 }
    );
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore(
      { error: "forbidden", message: "Only the main admin can access maintenance." },
      { status: 403 }
    );
  }

  try {
    const result = await clearStudentDashboardCaches(admin.id);
    return jsonNoStore({
      ok: true,
      message: "App snapshot cache cleared.",
      result
    });
  } catch (error) {
    return jsonNoStore(
      {
        error: "dashboard_cache_clear_failed",
        message: error instanceof Error ? error.message : "Unable to clear the dashboard cache."
      },
      { status: 400 }
    );
  }
}
