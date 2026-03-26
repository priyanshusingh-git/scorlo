import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getDashboardForStudent } from "@/lib/queries/dashboard";
import { getStudentLinkForUser } from "@/lib/queries/student-link";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (user.role !== "student") {
      return NextResponse.json(
        { error: "forbidden", message: "Dashboard data is available only for student accounts." },
        { status: 403 }
      );
    }

    const link = await getStudentLinkForUser(user.id);

    if (!link?.student_id) {
      return NextResponse.json(
        { error: "student_not_linked", link },
        { status: 404 }
      );
    }

    const dashboard = await getDashboardForStudent(link.student_id);

    return NextResponse.json({
      user,
      link,
      dashboard
    });
  } catch (error) {
    console.error("[api/dashboard] failed", error);
    return NextResponse.json(
      { error: "internal_server_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
