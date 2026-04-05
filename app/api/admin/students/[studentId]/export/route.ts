import { jsonNoStore } from "@/lib/api-response";
import { getCurrentAdminSessionUser } from "@/lib/auth/admin";
import {
  adminStudentSingleExportRequestSchema,
  normalizeAdminStudentExportColumns,
  normalizeAdminStudentExportSheets
} from "@/lib/admin/student-export";
import {
  buildAdminStudentExportFileName,
  buildAdminStudentExportResponse,
  buildAdminStudentExportWorkbook
} from "@/lib/admin/student-export-workbook";
import { getBranchScopedAccess } from "@/lib/staff-access";
import { getAdminStudentExportDatasetForStudent } from "@/lib/queries/admin-student-export";

export const runtime = "nodejs";

function parseStudentId(value: string) {
  const studentId = Number(value);
  if (!Number.isInteger(studentId) || studentId <= 0) {
    throw new Error("Invalid student id.");
  }

  return studentId;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ studentId: string }> }
) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore(
      { error: "unauthorized", message: "Admin session required." },
      { status: 401 }
    );
  }

  try {
    const { studentId } = await context.params;
    const parsedStudentId = parseStudentId(studentId);
    const parsed = adminStudentSingleExportRequestSchema.parse(await request.json());
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

    const dataset = await getAdminStudentExportDatasetForStudent({
      studentId: parsedStudentId,
      scopedBranch: getBranchScopedAccess(admin),
      selectedSheets
    });

    if (dataset.students.length === 0) {
      return jsonNoStore(
        {
          error: "student_not_found",
          message: "Student not found or not available for this staff account."
        },
        { status: 404 }
      );
    }

    const workbook = buildAdminStudentExportWorkbook({
      dataset,
      selectedColumns,
      selectedSheets
    });

    return buildAdminStudentExportResponse({
      buffer: workbook,
      fileName: buildAdminStudentExportFileName({
        scope: "student",
        presetId: parsed.presetId,
        studentName: dataset.students[0]?.name
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
