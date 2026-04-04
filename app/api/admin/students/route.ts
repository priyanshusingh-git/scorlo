import { jsonNoStore } from "@/lib/api-response";
import { getCurrentAdminSessionUser } from "@/lib/auth/admin";
import { searchAdminStudents } from "@/lib/queries/admin";
import { getBranchScopedAccess } from "@/lib/staff-access";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const branch = searchParams.get("branch") ?? "";
    const course = searchParams.get("course") ?? "";
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), 10);
    const result = await searchAdminStudents({
      query,
      branch,
      scopedBranch: getBranchScopedAccess(admin),
      course,
      page,
      pageSize
    });
    return jsonNoStore({ ok: true, ...result });
  } catch (error) {
    return jsonNoStore(
      { error: "students_fetch_failed", message: error instanceof Error ? error.message : "Unable to fetch students." },
      { status: 400 }
    );
  }
}
