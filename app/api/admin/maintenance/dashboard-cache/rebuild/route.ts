import { jsonNoStore } from "@/lib/api-response";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";
import { rebuildStudentDashboardCaches } from "@/lib/admin/mutations";

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
    const result = await rebuildStudentDashboardCaches(admin.id);
    return jsonNoStore({
      ok: true,
      message: `App snapshot cache rebuilt for ${result.rebuiltStudents} linked students.`,
      result
    });
  } catch (error) {
    return jsonNoStore(
      {
        error: "dashboard_cache_rebuild_failed",
        message:
          error instanceof Error ? error.message : "Unable to rebuild the dashboard cache."
      },
      { status: 400 }
    );
  }
}
