import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getDashboardForStudent } from "@/lib/queries/dashboard";
import { getStudentLinkForUser } from "@/lib/queries/student-link";

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
}
