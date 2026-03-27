import { NextResponse } from "next/server";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";
import { rebuildStudentRankings } from "@/lib/admin/mutations";

export async function POST() {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return NextResponse.json({ error: "forbidden", message: "Only the main admin can access maintenance." }, { status: 403 });
  }

  try {
    const result = await rebuildStudentRankings(admin.id);
    return NextResponse.json({
      ok: true,
      message: `Ranking cache rebuilt with ${result.totalRows} rows and ${result.refreshedSnapshots} app snapshots refreshed.`,
      result
    });
  } catch (error) {
    return NextResponse.json(
      { error: "ranking_rebuild_failed", message: error instanceof Error ? error.message : "Unable to rebuild rankings." },
      { status: 400 }
    );
  }
}
