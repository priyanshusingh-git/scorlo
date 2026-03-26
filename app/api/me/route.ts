import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getStudentLinkForUser } from "@/lib/queries/student-link";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const link = await getStudentLinkForUser(user.id);

    return NextResponse.json({
      user,
      link
    });
  } catch (error) {
    console.error("[api/me] failed", error);
    return NextResponse.json(
      { error: "internal_server_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
