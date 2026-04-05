import { z } from "zod";

export const ADMIN_STUDENT_EXPORT_PRESET_IDS = [
  "academic_summary",
  "ranking_summary",
  "detailed_results"
] as const;

export type AdminStudentExportPresetId = (typeof ADMIN_STUDENT_EXPORT_PRESET_IDS)[number];

export const ADMIN_STUDENT_EXPORT_SHEETS = ["students", "semesters", "subjects"] as const;
export type AdminStudentExportSheet = (typeof ADMIN_STUDENT_EXPORT_SHEETS)[number];

export const ADMIN_STUDENT_EXPORT_DETAIL_SHEETS = ["semesters", "subjects"] as const;
export type AdminStudentExportDetailSheet = (typeof ADMIN_STUDENT_EXPORT_DETAIL_SHEETS)[number];

export type AdminStudentExportColumnCategory = "identity" | "academic" | "ranking" | "linking";

type AdminStudentExportColumnDefinition = {
  id: string;
  label: string;
  description: string;
  category: AdminStudentExportColumnCategory;
  valueKey: string;
  defaultPresets: readonly AdminStudentExportPresetId[];
};

export const ADMIN_STUDENT_EXPORT_COLUMN_DEFINITIONS = [
  {
    id: "student_id",
    label: "Student ID",
    description: "Internal academic record identifier.",
    category: "identity",
    valueKey: "student_id",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "roll_no",
    label: "Roll No",
    description: "University roll number.",
    category: "identity",
    valueKey: "roll_no",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "enrollment_no",
    label: "Enrollment No",
    description: "Enrollment number stored in the academic record.",
    category: "identity",
    valueKey: "enrollment_no",
    defaultPresets: ["academic_summary", "detailed_results"]
  },
  {
    id: "name",
    label: "Student Name",
    description: "Student full name.",
    category: "identity",
    valueKey: "name",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "father_name",
    label: "Father Name",
    description: "Father name from the academic record.",
    category: "identity",
    valueKey: "father_name",
    defaultPresets: ["detailed_results"]
  },
  {
    id: "mother_name",
    label: "Mother Name",
    description: "Mother name from the academic record.",
    category: "identity",
    valueKey: "mother_name",
    defaultPresets: ["detailed_results"]
  },
  {
    id: "gender",
    label: "Gender",
    description: "Gender recorded in the source student profile.",
    category: "identity",
    valueKey: "gender",
    defaultPresets: ["detailed_results"]
  },
  {
    id: "institute_code",
    label: "Institute Code",
    description: "Institute code from the source student record.",
    category: "identity",
    valueKey: "institute_code",
    defaultPresets: ["detailed_results"]
  },
  {
    id: "institute_name",
    label: "Institute Name",
    description: "Institute name from the source student record.",
    category: "identity",
    valueKey: "institute_name",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "course_code",
    label: "Course Code",
    description: "Course code from the academic record.",
    category: "identity",
    valueKey: "course_code",
    defaultPresets: ["detailed_results"]
  },
  {
    id: "course_name",
    label: "Course Name",
    description: "Course name from the academic record.",
    category: "identity",
    valueKey: "course_name",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "branch_code",
    label: "Branch Code",
    description: "Branch code from the academic record.",
    category: "identity",
    valueKey: "branch_code",
    defaultPresets: ["detailed_results"]
  },
  {
    id: "branch_name",
    label: "Branch Name",
    description: "Branch name from the academic record.",
    category: "identity",
    valueKey: "branch_name",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "passing_year",
    label: "Passing Year",
    description: "Passing year / batch for the student.",
    category: "identity",
    valueKey: "passing_year",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "cgpa",
    label: "CGPA",
    description: "Weighted CGPA value.",
    category: "academic",
    valueKey: "cgpa",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "overall_percentage",
    label: "Overall Percentage",
    description: "Overall academic aggregate percentage.",
    category: "academic",
    valueKey: "overall_percentage",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "latest_sgpa",
    label: "Latest SGPA",
    description: "Latest semester SGPA available for the student.",
    category: "academic",
    valueKey: "latest_sgpa",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "active_backs",
    label: "Active Backs",
    description: "Current carry papers / active backs count.",
    category: "academic",
    valueKey: "active_backs",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "cleared_backs",
    label: "Cleared Backs",
    description: "Cleared backs count.",
    category: "academic",
    valueKey: "cleared_backs",
    defaultPresets: ["academic_summary", "ranking_summary", "detailed_results"]
  },
  {
    id: "branch_percentage_rank",
    label: "Branch Percentage Rank",
    description: "Branch-scope overall percentage rank.",
    category: "ranking",
    valueKey: "branch_percentage_rank",
    defaultPresets: ["ranking_summary", "detailed_results"]
  },
  {
    id: "branch_cgpa_rank",
    label: "Branch CGPA Rank",
    description: "Branch-scope CGPA rank.",
    category: "ranking",
    valueKey: "branch_cgpa_rank",
    defaultPresets: ["ranking_summary", "detailed_results"]
  },
  {
    id: "batch_percentage_rank",
    label: "Batch Percentage Rank",
    description: "Batch-scope overall percentage rank.",
    category: "ranking",
    valueKey: "batch_percentage_rank",
    defaultPresets: ["ranking_summary", "detailed_results"]
  },
  {
    id: "batch_cgpa_rank",
    label: "Batch CGPA Rank",
    description: "Batch-scope CGPA rank.",
    category: "ranking",
    valueKey: "batch_cgpa_rank",
    defaultPresets: ["ranking_summary", "detailed_results"]
  },
  {
    id: "linked_email",
    label: "Linked Email",
    description: "Email address of the linked app user, if available.",
    category: "linking",
    valueKey: "linked_email",
    defaultPresets: ["detailed_results"]
  },
  {
    id: "linked_status",
    label: "Link Status",
    description: "Current student link status in the app.",
    category: "linking",
    valueKey: "linked_status",
    defaultPresets: ["detailed_results"]
  },
  {
    id: "linked_dob",
    label: "Linked DOB",
    description: "DOB stored in the current app link record.",
    category: "linking",
    valueKey: "linked_dob",
    defaultPresets: ["detailed_results"]
  }
] as const satisfies readonly AdminStudentExportColumnDefinition[];

export type AdminStudentExportColumnId =
  (typeof ADMIN_STUDENT_EXPORT_COLUMN_DEFINITIONS)[number]["id"];

function getPresetColumnIds(presetId: AdminStudentExportPresetId) {
  return ADMIN_STUDENT_EXPORT_COLUMN_DEFINITIONS.filter((definition) =>
    (definition.defaultPresets as readonly AdminStudentExportPresetId[]).includes(presetId)
  ).map((definition) => definition.id);
}

export const ADMIN_STUDENT_EXPORT_PRESETS = [
  {
    id: "academic_summary",
    label: "Academic Summary",
    description: "Identity and core academic metrics.",
    defaultColumnIds: getPresetColumnIds("academic_summary"),
    defaultSheets: ["students"]
  },
  {
    id: "ranking_summary",
    label: "Ranking Summary",
    description: "Academic summary plus branch and batch rank columns.",
    defaultColumnIds: getPresetColumnIds("ranking_summary"),
    defaultSheets: ["students"]
  },
  {
    id: "detailed_results",
    label: "Detailed Results",
    description: "Academic summary with semester and subject sheets.",
    defaultColumnIds: getPresetColumnIds("detailed_results"),
    defaultSheets: ["students", "semesters", "subjects"]
  }
] as const satisfies ReadonlyArray<{
  id: AdminStudentExportPresetId;
  label: string;
  description: string;
  defaultColumnIds: readonly AdminStudentExportColumnId[];
  defaultSheets: readonly AdminStudentExportSheet[];
}>;

export const ADMIN_STUDENT_EXPORT_RANGE_VALUES = [
  "current_page",
  "all_filtered"
] as const;

export type AdminStudentExportRange = (typeof ADMIN_STUDENT_EXPORT_RANGE_VALUES)[number];

const adminStudentExportPresetIdSchema = z.enum(ADMIN_STUDENT_EXPORT_PRESET_IDS);
const adminStudentExportColumnIdSchema = z.enum(
  ADMIN_STUDENT_EXPORT_COLUMN_DEFINITIONS.map((definition) => definition.id) as [
    AdminStudentExportColumnId,
    ...AdminStudentExportColumnId[]
  ]
);
const adminStudentExportSheetSchema = z.enum(ADMIN_STUDENT_EXPORT_SHEETS);

export const adminStudentListExportRequestSchema = z.object({
  presetId: adminStudentExportPresetIdSchema,
  selectedColumns: z.array(adminStudentExportColumnIdSchema).default([]),
  selectedSheets: z.array(adminStudentExportSheetSchema).default(["students"]),
  range: z.enum(ADMIN_STUDENT_EXPORT_RANGE_VALUES),
  query: z.string().default(""),
  branch: z.string().default(""),
  course: z.string().default(""),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10)
});

export const adminStudentSingleExportRequestSchema = z.object({
  presetId: adminStudentExportPresetIdSchema,
  selectedColumns: z.array(adminStudentExportColumnIdSchema).default([]),
  selectedSheets: z.array(adminStudentExportSheetSchema).default(["students"])
});

export type AdminStudentListExportRequest = z.infer<
  typeof adminStudentListExportRequestSchema
>;

export type AdminStudentSingleExportRequest = z.infer<
  typeof adminStudentSingleExportRequestSchema
>;

export function getAdminStudentExportPreset(presetId: AdminStudentExportPresetId) {
  return (
    ADMIN_STUDENT_EXPORT_PRESETS.find((preset) => preset.id === presetId) ??
    ADMIN_STUDENT_EXPORT_PRESETS[0]
  );
}

export function normalizeAdminStudentExportColumns(
  columnIds: readonly AdminStudentExportColumnId[]
) {
  const validIds = new Set(
    ADMIN_STUDENT_EXPORT_COLUMN_DEFINITIONS.map((definition) => definition.id)
  );
  const seen = new Set<AdminStudentExportColumnId>();
  const normalized: AdminStudentExportColumnId[] = [];

  for (const columnId of columnIds) {
    if (!validIds.has(columnId) || seen.has(columnId)) continue;
    seen.add(columnId);
    normalized.push(columnId);
  }

  return normalized;
}

export function normalizeAdminStudentExportSheets(
  sheetIds: readonly AdminStudentExportSheet[]
) {
  const requested = new Set(sheetIds);
  const normalized: AdminStudentExportSheet[] = ["students"];

  for (const sheetId of ADMIN_STUDENT_EXPORT_DETAIL_SHEETS) {
    if (requested.has(sheetId)) {
      normalized.push(sheetId);
    }
  }

  return normalized;
}

export function getAdminStudentExportDefaultSelection(
  presetId: AdminStudentExportPresetId
) {
  const preset = getAdminStudentExportPreset(presetId);

  return {
    selectedColumns: [...preset.defaultColumnIds],
    selectedSheets: [...preset.defaultSheets]
  };
}
