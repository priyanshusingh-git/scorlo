"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, LoaderCircle, TableProperties } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import {
  ADMIN_STUDENT_EXPORT_COLUMN_DEFINITIONS,
  ADMIN_STUDENT_EXPORT_DETAIL_SHEETS,
  ADMIN_STUDENT_EXPORT_PRESETS,
  getAdminStudentExportDefaultSelection,
  type AdminStudentExportColumnCategory,
  type AdminStudentExportColumnId,
  type AdminStudentExportDetailSheet,
  type AdminStudentExportPresetId,
  type AdminStudentExportRange,
  type AdminStudentExportSheet
} from "@/lib/admin/student-export";

type ListModeProps = {
  mode: "list";
  query: string;
  branch: string;
  course: string;
  page: number;
  pageSize: number;
  totalCount: number;
};

type SingleModeProps = {
  mode: "single";
  studentId: number;
  studentLabel: string;
};

type Props = ListModeProps | SingleModeProps;

const detailSheetLabels: Record<AdminStudentExportDetailSheet, string> = {
  semesters: "Semesters",
  subjects: "Subjects"
};

const categoryLabels: Record<AdminStudentExportColumnCategory, string> = {
  identity: "Identity",
  academic: "Academic",
  ranking: "Ranking",
  linking: "Linking"
};

function parseFileName(disposition: string | null) {
  if (!disposition) return "scorlo-export.xlsx";

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = disposition.match(/filename="([^"]+)"/i);
  return plainMatch?.[1] ?? "scorlo-export.xlsx";
}

export function AdminStudentExportTrigger(props: Props) {
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [presetId, setPresetId] = useState<AdminStudentExportPresetId>("academic_summary");
  const [range, setRange] = useState<AdminStudentExportRange>("current_page");
  const [selectedColumns, setSelectedColumns] = useState<AdminStudentExportColumnId[]>(
    () => getAdminStudentExportDefaultSelection("academic_summary").selectedColumns
  );
  const [selectedSheets, setSelectedSheets] = useState<AdminStudentExportSheet[]>(
    () => getAdminStudentExportDefaultSelection("academic_summary").selectedSheets
  );

  const currentPageCount =
    props.mode === "list"
      ? Math.max(
          0,
          Math.min(
            props.pageSize,
            props.totalCount - (Math.max(props.page, 1) - 1) * props.pageSize
          )
        )
      : 1;

  const columnSections = useMemo(() => {
    return (Object.keys(categoryLabels) as AdminStudentExportColumnCategory[]).map((category) => ({
      category,
      label: categoryLabels[category],
      definitions: ADMIN_STUDENT_EXPORT_COLUMN_DEFINITIONS.filter(
        (definition) => definition.category === category
      )
    }));
  }, []);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscroll = documentElement.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  function applyPreset(nextPresetId: AdminStudentExportPresetId) {
    const defaults = getAdminStudentExportDefaultSelection(nextPresetId);
    setPresetId(nextPresetId);
    setSelectedColumns([...defaults.selectedColumns]);
    setSelectedSheets([...defaults.selectedSheets]);
  }

  function toggleColumn(columnId: AdminStudentExportColumnId) {
    setSelectedColumns((current) => {
      if (current.includes(columnId)) {
        return current.filter((entry) => entry !== columnId);
      }

      return [...current, columnId];
    });
  }

  function toggleDetailSheet(detailSheet: AdminStudentExportDetailSheet) {
    setSelectedSheets((current) => {
      const hasSheet = current.includes(detailSheet);
      const next = hasSheet
        ? current.filter((sheet) => sheet !== detailSheet)
        : [...current, detailSheet];

      return ["students", ...ADMIN_STUDENT_EXPORT_DETAIL_SHEETS.filter((sheet) => next.includes(sheet))];
    });
  }

  async function handleExport() {
    if (selectedColumns.length === 0) {
      pushToast({
        tone: "warning",
        title: "Select columns",
        description: "Pick at least one student column before exporting."
      });
      return;
    }

    setPending(true);

    try {
      const url =
        props.mode === "list"
          ? "/api/admin/students/export"
          : `/api/admin/students/${props.studentId}/export`;

      const body =
        props.mode === "list"
          ? {
              presetId,
              selectedColumns,
              selectedSheets,
              range,
              query: props.query,
              branch: props.branch,
              course: props.course,
              page: props.page,
              pageSize: props.pageSize
            }
          : {
              presetId,
              selectedColumns,
              selectedSheets
            };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        throw new Error(payload?.message ?? "Unable to generate the export.");
      }

      const blob = await response.blob();
      const fileName = parseFileName(response.headers.get("Content-Disposition"));
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      pushToast({
        tone: "success",
        title: "Export ready",
        description:
          props.mode === "list"
            ? "The Excel workbook was downloaded."
            : "The student workbook was downloaded."
      });
      setOpen(false);
    } catch (error) {
      pushToast({
        tone: "error",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unable to generate the export."
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-app/60"
      >
        <Download className="h-4 w-4" />
        <span>Export Excel</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[110] flex overflow-hidden bg-ink/45 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative mt-auto flex max-h-[100dvh] w-full justify-center px-3 pb-3 pt-10 sm:mt-0 sm:items-center sm:px-4 sm:pb-4 sm:pt-8">
            <div className="flex h-[min(92dvh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.6rem] border border-line bg-surface shadow-[0_28px_70px_-34px_rgba(16,32,49,0.48)] sm:h-auto sm:max-h-[88dvh]">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-info-soft p-2 text-info">
                  <TableProperties className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-ink">Admin Excel export</h3>
                  <p className="mt-1 text-sm leading-6 text-slate">
                    {props.mode === "list"
                      ? "Export the current students result set to an Excel workbook."
                      : `Export ${props.studentLabel} to an Excel workbook.`}
                  </p>
                </div>
              </div>
            </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Preset</span>
                  <select
                    value={presetId}
                    onChange={(event) =>
                      applyPreset(event.target.value as AdminStudentExportPresetId)
                    }
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
                    disabled={pending}
                  >
                    {ADMIN_STUDENT_EXPORT_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs leading-6 text-slate">
                    {
                      ADMIN_STUDENT_EXPORT_PRESETS.find((preset) => preset.id === presetId)
                        ?.description
                    }
                  </p>
                </label>

                {props.mode === "list" ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-ink">Row range</div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="rounded-[1.1rem] border border-line bg-app/40 px-4 py-3 text-sm text-ink">
                        <input
                          type="radio"
                          name="student-export-range"
                          className="mr-2"
                          checked={range === "current_page"}
                          onChange={() => setRange("current_page")}
                          disabled={pending}
                        />
                        Current page ({currentPageCount} row{currentPageCount === 1 ? "" : "s"})
                      </label>
                      <label className="rounded-[1.1rem] border border-line bg-app/40 px-4 py-3 text-sm text-ink">
                        <input
                          type="radio"
                          name="student-export-range"
                          className="mr-2"
                          checked={range === "all_filtered"}
                          onChange={() => setRange("all_filtered")}
                          disabled={pending}
                        />
                        All filtered rows ({props.totalCount})
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.1rem] border border-line bg-app/40 px-4 py-4 text-sm text-slate">
                    Students sheet is always included. Add detail sheets below when you need
                    semester or subject-level data.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-ink">Student columns</div>
                    <p className="text-xs leading-6 text-slate">
                      Selected columns control the required Students sheet.
                    </p>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-mist">
                    {selectedColumns.length} selected
                  </div>
                </div>

                <div className="space-y-4">
                  {columnSections.map((section) => (
                    <div key={section.category} className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-mist">
                        {section.label}
                      </div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {section.definitions.map((definition) => {
                          const checked = selectedColumns.includes(definition.id);

                          return (
                            <label
                              key={definition.id}
                              className={`rounded-[1rem] border px-4 py-3 text-sm transition ${
                                checked
                                  ? "border-ink bg-app/60 text-ink"
                                  : "border-line bg-surface text-slate hover:bg-app/30"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={checked}
                                onChange={() => toggleColumn(definition.id)}
                                disabled={pending}
                              />
                              <span className="font-semibold text-ink">{definition.label}</span>
                              <div className="mt-1 text-xs leading-6 text-slate">
                                {definition.description}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-ink">Detail sheets</div>
                <p className="text-xs leading-6 text-slate">
                  Students is always included. Enable extra sheets when you need result history.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ADMIN_STUDENT_EXPORT_DETAIL_SHEETS.map((detailSheet) => {
                    const checked = selectedSheets.includes(detailSheet);

                    return (
                      <label
                        key={detailSheet}
                        className={`rounded-[1rem] border px-4 py-3 text-sm transition ${
                          checked
                            ? "border-ink bg-app/60 text-ink"
                            : "border-line bg-surface text-slate hover:bg-app/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={checked}
                          onChange={() => toggleDetailSheet(detailSheet)}
                          disabled={pending}
                        />
                        <span className="font-semibold text-ink">
                          {detailSheetLabels[detailSheet]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
                <div className="text-xs leading-6 text-slate">
                  Students sheet will contain {selectedColumns.length} column
                  {selectedColumns.length === 1 ? "" : "s"}.
                </div>
                <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-app/60 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={pending || selectedColumns.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
                  >
                    {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    <span>{pending ? "Preparing..." : "Download .xlsx"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
