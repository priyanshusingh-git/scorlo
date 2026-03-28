import { jsonNoStore } from "@/lib/api-response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getStudentLinkForUser } from "@/lib/queries/student-link";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return jsonNoStore({ error: "unauthorized" }, { status: 401 });
    }

    const link = await getStudentLinkForUser(user.id);

    return jsonNoStore({
      user,
      link
    });
  } catch (error) {
    console.error("[api/me] failed", error);
    return jsonNoStore(
      { error: "internal_server_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
