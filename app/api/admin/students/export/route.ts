import { jsonNoStore } from "@/lib/api-response";
import { getCurrentAdminSessionUser } from "@/lib/auth/admin";
import {
  adminStudentListExportRequestSchema,
  normalizeAdminStudentExportColumns,
  normalizeAdminStudentExportSheets
} from "@/lib/admin/student-export";
import {
  buildAdminStudentExportFileName,
  buildAdminStudentExportResponse,
  buildAdminStudentExportWorkbook
} from "@/lib/admin/student-export-workbook";
import { getBranchScopedAccess } from "@/lib/staff-access";
import { getAdminStudentExportDatasetForList } from "@/lib/queries/admin-student-export";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore(
      { error: "unauthorized", message: "Admin session required." },
      { status: 401 }
    );
  }

  try {
    const parsed = adminStudentListExportRequestSchema.parse(await request.json());
    const selectedColumns = normalizeAdminStudentExportColumns(parsed.selectedColumns);
    const selectedSheets = normalizeAdminStudentExportSheets(parsed.selectedSheets);

    if (selectedColumns.length === 0) {
      return jsonNoStore(
        {
          error: "invalid_export_columns",
          message: "Select at least one student column for the export."
        },
        { status: 400 }
      );
    }

    const dataset = await getAdminStudentExportDatasetForList({
      query: parsed.query,
      branch: parsed.branch,
      scopedBranch: getBranchScopedAccess(admin),
      course: parsed.course,
      range: parsed.range,
      page: parsed.page,
      pageSize: parsed.pageSize,
      selectedSheets
    });

    const workbook = buildAdminStudentExportWorkbook({
      dataset,
      selectedColumns,
      selectedSheets
    });

    return buildAdminStudentExportResponse({
      buffer: workbook,
      fileName: buildAdminStudentExportFileName({
        scope: "students",
        presetId: parsed.presetId
      })
    });
  } catch (error) {
    return jsonNoStore(
      {
        error: "student_export_failed",
        message:
          error instanceof Error ? error.message : "Unable to generate the student export."
      },
      { status: 400 }
    );
  }
}
