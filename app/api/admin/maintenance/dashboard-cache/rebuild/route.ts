import { NextResponse } from "next/server";
import { getCurrentAdminSessionUser } from "@/lib/auth/admin";
import { rebuildStudentDashboardCaches } from "@/lib/admin/mutations";

export async function POST() {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return NextResponse.json(
      { error: "unauthorized", message: "Admin session required." },
      { status: 401 }
    );
  }

  try {
    const result = await rebuildStudentDashboardCaches(admin.id);
    return NextResponse.json({
      ok: true,
      message: `App snapshot cache rebuilt for ${result.rebuiltStudents} linked students.`,
      result
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "dashboard_cache_rebuild_failed",
        message:
          error instanceof Error ? error.message : "Unable to rebuild the dashboard cache."
      },
      { status: 400 }
    );
  }
}
