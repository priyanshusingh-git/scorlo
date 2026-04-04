import { jsonNoStore } from "@/lib/api-response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getDashboardForStudent } from "@/lib/queries/dashboard";
import { getStudentLinkForUser } from "@/lib/queries/student-link";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return jsonNoStore({ error: "unauthorized" }, { status: 401 });
    }

    if (user.role !== "student") {
      return jsonNoStore(
        { error: "forbidden", message: "Dashboard data is available only for student accounts." },
        { status: 403 }
      );
    }

    if (!user.dashboard_access_enabled) {
      return jsonNoStore(
        { error: "dashboard_access_disabled", message: "Your dashboard access has been disabled by the admin." },
        { status: 403 }
      );
    }

    const link = await getStudentLinkForUser(user.id);

    if (!link?.student_id) {
      return jsonNoStore(
        { error: "student_not_linked", link },
        { status: 404 }
      );
    }

    const dashboard = await getDashboardForStudent(link.student_id);

    return jsonNoStore({
      user,
      link,
      dashboard
    });
  } catch (error) {
    console.error("[api/dashboard] failed", error);
    return jsonNoStore(
      { error: "internal_server_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
