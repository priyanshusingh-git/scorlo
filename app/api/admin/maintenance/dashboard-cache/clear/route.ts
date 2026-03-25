import { NextResponse } from "next/server";
import { getCurrentAdminSessionUser } from "@/lib/auth/admin";
import { clearStudentDashboardCaches } from "@/lib/admin/mutations";

export async function POST() {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return NextResponse.json(
      { error: "unauthorized", message: "Admin session required." },
      { status: 401 }
    );
  }

  try {
    const result = await clearStudentDashboardCaches(admin.id);
    return NextResponse.json({
      ok: true,
      message: "App snapshot cache cleared.",
      result
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "dashboard_cache_clear_failed",
        message: error instanceof Error ? error.message : "Unable to clear the dashboard cache."
      },
      { status: 400 }
    );
  }
}
