"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import { Download, LoaderCircle } from "lucide-react";
import type { StudentAppSnapshot } from "@/lib/queries/dashboard";

function buildSummaryText(snapshot: StudentAppSnapshot) {
  const { dashboard } = snapshot;
  const lines = [
    "Scorlo Result Summary",
    `Name: ${dashboard.student.name ?? "Not available"}`,
    `Roll No: ${dashboard.student.roll_no}`,
    `Branch: ${dashboard.student.branch_name ?? "Not available"}`,
    `CGPA: ${dashboard.metrics.cgpa ?? "--"}`,
    `Overall Percentage: ${dashboard.metrics.overall_percentage ?? "--"}`,
    `Active Backs: ${dashboard.metrics.active_backs}`,
    `Cleared Backs: ${dashboard.metrics.cleared_backs}`,
    "",
    "Semesters"
  ];

  for (const semester of dashboard.semesters) {
    lines.push(
      `Semester ${semester.semester_no}: SGPA ${semester.sgpa ?? "--"} • ${semester.status_badge_label}`
    );
  }

  return lines.join("\n");
}

function formatDeclarationDate(value: string) {
  if (!value) return "Unavailable";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsed);
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function ResultsSummaryActions({ snapshot }: { snapshot: StudentAppSnapshot }) {
  const [pendingExport, setPendingExport] = useState(false);

  async function handleExportPdf() {
    setPendingExport(true);

    try {
      const { dashboard } = snapshot;
      const doc = new jsPDF({
        unit: "pt",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 42;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const colors = {
        ink: [18, 32, 53] as const,
        accent: [25, 84, 166] as const,
        gold: [186, 139, 48] as const,
        border: [219, 226, 235] as const,
        muted: [91, 108, 128] as const,
        panel: [246, 248, 251] as const,
        white: [255, 255, 255] as const
      };

      const setTextColor = (rgb: readonly [number, number, number]) => {
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      };

      const ensureSpace = (height: number) => {
        if (y + height <= pageHeight - margin) return;
        doc.addPage();
        y = margin;
      };

      const writeText = (
        text: string,
        options?: {
          x?: number;
          y?: number;
          size?: number;
          color?: readonly [number, number, number];
          weight?: "normal" | "bold";
          maxWidth?: number;
          lineGap?: number;
        }
      ) => {
        const x = options?.x ?? margin;
        const lineGap = options?.lineGap ?? 15;
        const width = options?.maxWidth ?? contentWidth;
        doc.setFont("helvetica", options?.weight ?? "normal");
        doc.setFontSize(options?.size ?? 11);
        setTextColor(options?.color ?? colors.ink);
        const lines = doc.splitTextToSize(text, width) as string[];
        let drawY = options?.y ?? y;

        for (const line of lines) {
          doc.text(line, x, drawY);
          drawY += lineGap;
        }

        if (options?.y === undefined) {
          y = drawY;
        }

        return drawY;
      };

      const drawMetricCard = (
        x: number,
        top: number,
        width: number,
        label: string,
        value: string,
        tone: "accent" | "gold" | "ink"
      ) => {
        const height = 72;
        const toneColor =
          tone === "accent" ? colors.accent : tone === "gold" ? colors.gold : colors.ink;

        doc.setFillColor(colors.panel[0], colors.panel[1], colors.panel[2]);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.roundedRect(x, top, width, height, 14, 14, "FD");

        doc.setFillColor(toneColor[0], toneColor[1], toneColor[2]);
        doc.roundedRect(x + 14, top + 15, 5, 42, 4, 4, "F");

        writeText(label, {
          x: x + 30,
          y: top + 29,
          size: 9,
          color: colors.muted,
          weight: "bold",
          lineGap: 11,
          maxWidth: width - 42
        });
        writeText(value, {
          x: x + 30,
          y: top + 53,
          size: 19,
          color: colors.ink,
          weight: "bold",
          lineGap: 18,
          maxWidth: width - 42
        });
      };

      const drawSectionLabel = (label: string) => {
        ensureSpace(28);
        writeText(label.toUpperCase(), {
          size: 9,
          color: colors.accent,
          weight: "bold",
          lineGap: 10
        });
        y += 4;
      };

      doc.setFillColor(colors.ink[0], colors.ink[1], colors.ink[2]);
      doc.roundedRect(margin, y, contentWidth, 132, 24, 24, "F");

      writeText("SCORLO", {
        x: margin + 24,
        y: y + 28,
        size: 10,
        color: colors.white,
        weight: "bold",
        lineGap: 11
      });
      writeText("Academic result summary", {
        x: margin + 24,
        y: y + 56,
        size: 24,
        color: colors.white,
        weight: "bold",
        lineGap: 24,
        maxWidth: contentWidth - 160
      });
      writeText(
        `${dashboard.student.name ?? "Student"} • ${dashboard.student.roll_no}`,
        {
          x: margin + 24,
          y: y + 86,
          size: 11,
          color: [220, 229, 239],
          lineGap: 13,
          maxWidth: contentWidth - 48
        }
      );

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageWidth - margin - 126, y + 20, 102, 34, 16, 16, "F");
      writeText("Generated", {
        x: pageWidth - margin - 112,
        y: y + 35,
        size: 8,
        color: colors.muted,
        weight: "bold",
        lineGap: 10,
        maxWidth: 82
      });
      writeText(formatDeclarationDate(new Date().toISOString()), {
        x: pageWidth - margin - 112,
        y: y + 49,
        size: 10,
        color: colors.ink,
        weight: "bold",
        lineGap: 11,
        maxWidth: 82
      });

      y += 156;

      drawSectionLabel("Student");
      writeText(`${dashboard.student.name ?? "Not available"}`, {
        size: 17,
        weight: "bold",
        lineGap: 18
      });
      writeText(
        `${dashboard.student.roll_no} • ${dashboard.student.branch_name ?? "Branch unavailable"} • ${dashboard.student.course_name ?? "Course unavailable"}`,
        {
          size: 11,
          color: colors.muted,
          lineGap: 15
        }
      );
      writeText(dashboard.student.institute_name ?? "Institute unavailable", {
        size: 11,
        color: colors.muted,
        lineGap: 15
      });

      y += 10;
      ensureSpace(164);
      drawSectionLabel("Academic standing");
      const cardGap = 12;
      const cardWidth = (contentWidth - cardGap) / 2;
      const metricsTop = y;
      drawMetricCard(margin, metricsTop, cardWidth, "CGPA", dashboard.metrics.cgpa ?? "--", "accent");
      drawMetricCard(
        margin + cardWidth + cardGap,
        metricsTop,
        cardWidth,
        "Overall percentage",
        dashboard.metrics.overall_percentage ?? "--",
        "gold"
      );
      drawMetricCard(
        margin,
        metricsTop + 84,
        cardWidth,
        "Active backs",
        String(dashboard.metrics.active_backs),
        dashboard.metrics.active_backs > 0 ? "gold" : "ink"
      );
      drawMetricCard(
        margin + cardWidth + cardGap,
        metricsTop + 84,
        cardWidth,
        "Cleared backs",
        String(dashboard.metrics.cleared_backs),
        "ink"
      );
      y = metricsTop + 170;

      drawSectionLabel("Semester archive");
      ensureSpace(34);

      const tableColumns = [
        { label: "Sem", width: 44 },
        { label: "SGPA", width: 74 },
        { label: "Status", width: 128 },
        { label: "Declared", width: 100 }
      ] as const;

      const drawTableHeader = () => {
        doc.setFillColor(colors.panel[0], colors.panel[1], colors.panel[2]);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.roundedRect(margin, y, contentWidth, 28, 10, 10, "FD");

        let x = margin + 14;
        for (const column of tableColumns) {
          writeText(column.label, {
            x,
            y: y + 18,
            size: 9,
            color: colors.muted,
            weight: "bold",
            lineGap: 10,
            maxWidth: column.width - 8
          });
          x += column.width;
        }
        y += 40;
      };

      drawTableHeader();

      for (const semester of dashboard.semesters) {
        ensureSpace(34);
        if (y === margin) {
          drawSectionLabel("Semester archive");
          drawTableHeader();
        }

        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.line(margin, y + 20, pageWidth - margin, y + 20);

        let x = margin + 14;
        const row = [
          String(semester.semester_no),
          semester.sgpa ?? "--",
          semester.status_badge_label,
          semester.formatted_declaration_date || "Unavailable"
        ];

        row.forEach((value, index) => {
          const column = tableColumns[index];
          writeText(value, {
            x,
            y: y + 14,
            size: 10.5,
            color: index === 2 ? colors.accent : colors.ink,
            weight: index === 0 ? "bold" : "normal",
            lineGap: 11,
            maxWidth: column.width - 8
          });
          x += column.width;
        });

        y += 30;
      }

      writeText("Prepared from your latest Scorlo academic snapshot.", {
        y: pageHeight - margin + 2,
        x: margin,
        size: 8.5,
        color: colors.muted,
        maxWidth: contentWidth,
        lineGap: 10
      });

      const safeName = sanitizeFileName(dashboard.student.name ?? dashboard.student.roll_no);
      doc.save(`scorlo-result-summary-${safeName || "student"}.pdf`);
    } catch {
      // Ignore export errors here; the button state is kept stable and the UI remains unchanged.
    } finally {
      setPendingExport(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExportPdf}
      disabled={pendingExport}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white disabled:opacity-60"
      aria-label={pendingExport ? "Exporting PDF" : "Download PDF"}
      title={pendingExport ? "Exporting..." : "Download PDF"}
    >
      {pendingExport ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
    </button>
  );
}
