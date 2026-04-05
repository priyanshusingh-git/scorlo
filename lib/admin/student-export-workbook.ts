import "server-only";

import * as XLSX from "xlsx";
import {
  ADMIN_STUDENT_EXPORT_COLUMN_DEFINITIONS,
  type AdminStudentExportColumnId,
  type AdminStudentExportPresetId,
  type AdminStudentExportSheet
} from "@/lib/admin/student-export";
import type {
  AdminStudentExportDataset,
  AdminStudentExportSemesterRow,
  AdminStudentExportStudentRow,
  AdminStudentExportSubjectRow
} from "@/lib/queries/admin-student-export";

const semesterSheetColumns: Array<{
  label: string;
  accessor: (row: AdminStudentExportSemesterRow) => string | number | null;
}> = [
  { label: "Student ID", accessor: (row) => row.student_id },
  { label: "Roll No", accessor: (row) => row.roll_no },
  { label: "Student Name", accessor: (row) => row.student_name },
  { label: "Semester No", accessor: (row) => row.semester_no },
  { label: "Result Status", accessor: (row) => row.result_status },
  { label: "SGPA", accessor: (row) => row.sgpa },
  { label: "Total Marks Obtained", accessor: (row) => row.total_marks_obtained },
  { label: "Marks Maximum", accessor: (row) => row.marks_maximum },
  { label: "Session ID", accessor: (row) => row.session_id },
  { label: "Session Type", accessor: (row) => row.session_type },
  { label: "Declaration Date", accessor: (row) => row.date_of_declaration },
  { label: "Branch Rank", accessor: (row) => row.branch_rank },
  { label: "Batch Rank", accessor: (row) => row.batch_rank }
];

const subjectSheetColumns: Array<{
  label: string;
  accessor: (row: AdminStudentExportSubjectRow) => string | number | null;
}> = [
  { label: "Student ID", accessor: (row) => row.student_id },
  { label: "Roll No", accessor: (row) => row.roll_no },
  { label: "Student Name", accessor: (row) => row.student_name },
  { label: "Semester No", accessor: (row) => row.semester_no },
  { label: "Subject Code", accessor: (row) => row.subject_code },
  { label: "Subject Name", accessor: (row) => row.subject_name },
  { label: "Subject Type", accessor: (row) => row.subject_type },
  { label: "Internal Marks", accessor: (row) => row.internal_marks },
  { label: "External Marks", accessor: (row) => row.external_marks },
  { label: "Total Marks", accessor: (row) => row.total_marks },
  { label: "Grade", accessor: (row) => row.grade },
  { label: "Back Paper", accessor: (row) => row.back_paper }
];

function normalizeCellValue(value: string | number | boolean | null | undefined) {
  return value ?? "";
}

function buildColumnWidths(rows: Array<Array<string | number | boolean | null | undefined>>) {
  if (rows.length === 0) {
    return [];
  }

  const columnCount = rows[0]?.length ?? 0;

  return Array.from({ length: columnCount }, (_, index) => {
    const maxLength = rows.reduce((currentMax, row) => {
      const value = row[index];
      const nextLength = String(value ?? "").length;
      return Math.max(currentMax, nextLength);
    }, 10);

    return {
      wch: Math.min(Math.max(maxLength + 2, 12), 40)
    };
  });
}

function addSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
) {
  const aoa = [headers, ...rows];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = buildColumnWidths(aoa);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
}

export function buildAdminStudentExportWorkbook({
  dataset,
  selectedColumns,
  selectedSheets
}: {
  dataset: AdminStudentExportDataset;
  selectedColumns: readonly AdminStudentExportColumnId[];
  selectedSheets: readonly AdminStudentExportSheet[];
}) {
  const workbook = XLSX.utils.book_new();
  const studentDefinitions = selectedColumns.map((columnId) => {
    const definition = ADMIN_STUDENT_EXPORT_COLUMN_DEFINITIONS.find(
      (candidate) => candidate.id === columnId
    );

    if (!definition) {
      throw new Error(`Unknown export column: ${columnId}`);
    }

    return definition;
  });

  addSheet(
    workbook,
    "Students",
    studentDefinitions.map((definition) => definition.label),
    dataset.students.map((student) =>
      studentDefinitions.map((definition) =>
        normalizeCellValue(
          student[definition.valueKey as keyof AdminStudentExportStudentRow] as
            | string
            | number
            | boolean
            | null
            | undefined
        )
      )
    )
  );

  if (selectedSheets.includes("semesters")) {
    addSheet(
      workbook,
      "Semesters",
      semesterSheetColumns.map((column) => column.label),
      dataset.semesters.map((row) =>
        semesterSheetColumns.map((column) => normalizeCellValue(column.accessor(row)))
      )
    );
  }

  if (selectedSheets.includes("subjects")) {
    addSheet(
      workbook,
      "Subjects",
      subjectSheetColumns.map((column) => column.label),
      dataset.subjects.map((row) =>
        subjectSheetColumns.map((column) => normalizeCellValue(column.accessor(row)))
      )
    );
  }

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
    compression: true,
    Props: {
      Title: "Scorlo Admin Export",
      Subject: "Student academic export",
      Author: "Scorlo",
      Company: "Scorlo"
    }
  });
}

function sanitizeFileNameSegment(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function buildAdminStudentExportFileName({
  scope,
  presetId,
  studentName
}: {
  scope: "students" | "student";
  presetId: AdminStudentExportPresetId;
  studentName?: string | null;
}) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const presetSegment = sanitizeFileNameSegment(presetId);

  if (scope === "student") {
    const nameSegment = sanitizeFileNameSegment(studentName?.trim() || "student");
    return `scorlo-${nameSegment}-${presetSegment}-${dateStamp}.xlsx`;
  }

  return `scorlo-students-${presetSegment}-${dateStamp}.xlsx`;
}

export function buildAdminStudentExportResponse({
  buffer,
  fileName
}: {
  buffer: Buffer;
  fileName: string;
}) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(buffer.byteLength)
    }
  });
}
