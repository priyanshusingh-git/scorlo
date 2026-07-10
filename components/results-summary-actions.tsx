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
        ink: [33, 37, 41] as const,       // Dark Charcoal
        accent: [58, 80, 107] as const,    // Professional Steel Blue
        gold: [186, 139, 48] as const,     // Gold for CGPA
        border: [222, 226, 230] as const,  // Light Gray
        muted: [108, 117, 125] as const,   // Muted Gray
        panel: [248, 249, 250] as const,   // Very Light Gray
        red: [220, 53, 69] as const,       // Soft Red
        green: [40, 167, 69] as const,     // Soft Green
        blue: [0, 91, 187] as const,       // Professional Blue for PWG
        white: [255, 255, 255] as const
      };

      const setTextColor = (rgb: readonly [number, number, number]) => {
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
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

      const ensureSpace = (height: number) => {
        if (y + height <= pageHeight - margin - 35) return;
        doc.addPage();
        y = margin;

        // Draw running header on new pages
        writeText("SCORLO ACADEMIC REPORT", {
          size: 7.5,
          color: colors.muted,
          weight: "bold",
          lineGap: 9
        });
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.line(margin, y + 4, pageWidth - margin, y + 4);
        y += 16;
      };

      // Header Block (Clean, Modern Typography)
      writeText("SCORLO ACADEMIC REPORT SUMMARY", {
        size: 14,
        color: colors.accent,
        weight: "bold",
        lineGap: 18
      });
      y += 4;
      doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.setLineWidth(1.5);
      doc.line(margin, y, pageWidth - margin, y);
      doc.setLineWidth(1.0);
      y += 16;

      // Student Details Grid
      ensureSpace(80);
      const col1Width = 240;
      const startCol2 = margin + col1Width;
      
      // Row 1
      writeText("Student Name:", { x: margin, y, size: 9, color: colors.muted, weight: "bold", maxWidth: 80 });
      writeText(dashboard.student.name ?? "Not available", { x: margin + 80, y, size: 9.5, color: colors.ink, weight: "bold", maxWidth: col1Width - 90 });
      
      writeText("Roll Number:", { x: startCol2, y, size: 9, color: colors.muted, weight: "bold", maxWidth: 80 });
      writeText(dashboard.student.roll_no, { x: startCol2 + 80, y, size: 9.5, color: colors.ink, weight: "bold", maxWidth: col1Width - 90 });
      
      y += 18;

      // Row 2
      writeText("Course Name:", { x: margin, y, size: 9, color: colors.muted, weight: "bold", maxWidth: 80 });
      writeText(dashboard.student.course_name ?? "Not available", { x: margin + 80, y, size: 9, color: colors.ink, maxWidth: col1Width - 90 });
      
      writeText("Branch Name:", { x: startCol2, y, size: 9, color: colors.muted, weight: "bold", maxWidth: 80 });
      writeText(dashboard.student.branch_name ?? "Not available", { x: startCol2 + 80, y, size: 9, color: colors.ink, maxWidth: col1Width - 90 });
      
      y += 18;

      // Row 3
      writeText("Institute:", { x: margin, y, size: 9, color: colors.muted, weight: "bold", maxWidth: 80 });
      writeText(dashboard.student.institute_name ?? "Not available", { x: margin + 80, y, size: 9, color: colors.ink, maxWidth: contentWidth - 90 });
      
      y += 24;

      // Summary Divider
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;

      // Overall Standing Bar
      ensureSpace(35);
      doc.setFillColor(colors.panel[0], colors.panel[1], colors.panel[2]);
      doc.roundedRect(margin, y, contentWidth, 24, 4, 4, "F");

      const stats = [
        { label: "CGPA:", value: dashboard.metrics.cgpa ?? "--" },
        { label: "Overall %:", value: dashboard.metrics.overall_percentage ?? "--" },
        { label: "Active Backs:", value: String(dashboard.metrics.active_backs) },
        { label: "Cleared Backs:", value: String(dashboard.metrics.cleared_backs) }
      ];

      let statX = margin + 12;
      for (const stat of stats) {
        writeText(stat.label, { x: statX, y: y + 15, size: 8.5, color: colors.muted, weight: "bold" });
        statX += doc.getTextWidth(stat.label) + 4;
        writeText(stat.value, { x: statX, y: y + 15, size: 9, color: colors.ink, weight: "bold" });
        statX += doc.getTextWidth(stat.value) + 24;
      }
      y += 36;

      // Semester Archive (Header)
      writeText("SEMESTER WISE ACADEMIC DETAILS", {
        size: 10,
        color: colors.accent,
        weight: "bold",
        lineGap: 14
      });
      y += 6;

      // Table Header Helper
      const drawTableHeader = () => {
        ensureSpace(22);
        doc.setFillColor(colors.panel[0], colors.panel[1], colors.panel[2]);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.roundedRect(margin, y, contentWidth, 18, 4, 4, "FD");

        let headerX = margin + 8;
        const columns = [
          { label: "Code", width: 60 },
          { label: "Subject Name", width: 180 },
          { label: "Type", width: 50 },
          { label: "Int", width: 40 },
          { label: "Ext", width: 40 },
          { label: "Tot", width: 40 },
          { label: "Gr", width: 30 },
          { label: "Status", width: 70 }
        ];

        for (const col of columns) {
          writeText(col.label, {
            x: headerX,
            y: y + 12,
            size: 8,
            color: colors.muted,
            weight: "bold",
            lineGap: 9,
            maxWidth: col.width - 2
          });
          headerX += col.width;
        }
        y += 18;
      };

      for (const semester of dashboard.semesters) {
        ensureSpace(40);
        
        // Draw Semester Banner Info
        doc.setFillColor(colors.panel[0], colors.panel[1], colors.panel[2]);
        doc.rect(margin, y, contentWidth, 20, "F");
        doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        doc.line(margin, y, margin, y + 20); // Left border accent

        const semTitle = `Semester ${semester.semester_no}`;
        const semDetails = `SGPA: ${semester.sgpa ?? "--"}  |  Marks: ${semester.total_marks_obtained ?? "--"}${semester.max_marks !== null ? ` / ${semester.max_marks}` : ""}${semester.percentage ? ` (${semester.percentage}%)` : ""}  |  Session: ${semester.session_id || "--"} (${semester.session_type || "--"})`;
        
        writeText(semTitle, {
          x: margin + 8,
          y: y + 13,
          size: 9.5,
          color: colors.accent,
          weight: "bold",
          maxWidth: 100
        });
        
        writeText(semDetails, {
          x: margin + 120,
          y: y + 13,
          size: 8.5,
          color: colors.muted,
          weight: "bold",
          maxWidth: contentWidth - 130
        });
        
        y += 24;

        // Draw Table Header
        drawTableHeader();

        // Subjects List
        if (semester.subjects.length === 0) {
          ensureSpace(20);
          writeText("Subject-level marks are not available for this semester.", {
            x: margin + 12,
            size: 8.5,
            color: colors.muted,
            lineGap: 12
          });
          y += 12;
        } else {
          for (const sub of semester.subjects) {
            const nameWidth = 180;
            const nameLines = doc.splitTextToSize(sub.name ?? "Untitled subject", nameWidth - 2) as string[];
            const rowHeight = 16 + (nameLines.length - 1) * 9;

            ensureSpace(rowHeight);

            let rowX = margin + 8;
            const isBack = sub.grade === "F" || sub.grade === "AB" || sub.grade === "ABSENT" || sub.status_label === "Carry paper";
            const isPwg = (sub.grade ?? "").endsWith("#") || sub.status_label === "Grace Clear";

            const rowColor = isBack
              ? colors.red
              : isPwg
              ? colors.blue
              : colors.ink;

            const statusColor = isBack
              ? colors.red
              : isPwg
              ? colors.blue
              : sub.status_label === "Review"
              ? colors.gold
              : colors.green;

            const columns = [
              { value: sub.code ?? "--", width: 60, weight: "bold" as const, color: rowColor },
              { value: sub.name ?? "Untitled subject", width: 180, color: rowColor },
              { value: sub.type ?? "--", width: 50, color: rowColor },
              { value: String(sub.internal_marks ?? "--"), width: 40, color: rowColor },
              { value: String(sub.external_marks ?? "--"), width: 40, color: rowColor },
              { value: String(sub.total_marks ?? "--"), width: 40, color: rowColor },
              { value: sub.grade ?? "--", width: 30, weight: "bold" as const, color: rowColor },
              { 
                value: sub.status_label ?? "--", 
                width: 70, 
                color: statusColor,
                weight: "bold" as const
              }
            ];

            for (const col of columns) {
              writeText(col.value, {
                x: rowX,
                y: y + 11,
                size: 8,
                color: col.color ?? colors.ink,
                weight: col.weight ?? "normal",
                lineGap: 9,
                maxWidth: col.width - 2
              });
              rowX += col.width;
            }

            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
            y += rowHeight;
          }
        }
        y += 12; // Gap between semesters
      }

      // Add Running Footers
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin - 45,
          pageHeight - 20
        );
        doc.text(
          "Scorlo Academic Transcript Summary • Generated directly from Scorlo Academic Database.",
          margin,
          pageHeight - 20
        );
      }

      const safeName = sanitizeFileName(dashboard.student.name ?? dashboard.student.roll_no);
      doc.save(`scorlo-transcript-${safeName || "student"}.pdf`);
    } catch (error) {
      console.error("PDF Export error:", error);
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
