"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { DashboardPayload } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

function getSemesterStatus(semester: DashboardPayload["semesters"][number]) {
  const activeCarryCount = semester.cop_subjects.length;
  const hasGraceClear = semester.subjects.some((subject) => {
    const grade = (subject.grade ?? "").trim().toUpperCase();
    return grade === "E#";
  });
  const rawStatus = (semester.result_status ?? "").trim().toUpperCase();

  if (activeCarryCount > 0) {
    return {
      label: `CP(${activeCarryCount})`,
      tone: "warning" as const
    };
  }

  if (hasGraceClear) {
    return {
      label: "PWG",
      tone: "accent" as const
    };
  }

  if (rawStatus.includes("PASS")) {
    return {
      label: "PASS",
      tone: "success" as const
    };
  }

  if (rawStatus.includes("CP") || rawStatus.includes("PWG")) {
    return {
      label: "CP(0)",
      tone: "success" as const
    };
  }

  return {
    label: semester.result_status ?? "Unknown",
    tone: "accent" as const
  };
}

function getSubjectStatus(
  subject: DashboardPayload["semesters"][number]["subjects"][number],
  copSubjects: string[]
) {
  const grade = (subject.grade ?? "").trim().toUpperCase();
  const isCarryPaper =
    (subject.code !== null && copSubjects.includes(subject.code)) ||
    grade === "F" ||
    grade === "AB" ||
    grade === "ABSENT";

  if (isCarryPaper) {
    return {
      label: "Carry paper",
      className: "text-danger"
    };
  }

  if (grade === "E#") {
    return {
      label: "Grace clear",
      className: "text-success"
    };
  }

  if (grade === "WH" || grade === "UFM") {
    return {
      label: "Review",
      className: "text-warning"
    };
  }

  return {
    label: "Clear",
    className: "text-success"
  };
}

function formatDeclarationDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function SemesterCards({
  semesters
}: {
  semesters: DashboardPayload["semesters"];
}) {
  return (
    <Accordion.Root type="single" collapsible className="space-y-3">
      {semesters.map((semester) => {
        const semesterStatus = getSemesterStatus(semester);

        return (
          <Accordion.Item
            key={semester.id}
            value={`semester-${semester.semester_no}`}
            className="overflow-hidden rounded-scorlo border border-line bg-surface shadow-soft"
          >
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full flex-col gap-4 px-5 py-4 text-left md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-lg font-bold tracking-[-0.03em] text-ink">
                  Semester {semester.semester_no}
                </div>
                <div className="mt-1 text-sm text-slate">
                  SGPA {semester.sgpa ?? "--"} • {semester.total_marks_obtained ?? "--"} marks •{" "}
                  {formatDeclarationDate(semester.date_of_declaration)}
                </div>
              </div>
              <div className="flex items-center gap-3 self-start md:self-center">
                <StatusBadge tone={semesterStatus.tone}>
                  {semesterStatus.label}
                </StatusBadge>
                <ChevronDown className="h-4 w-4 text-mist transition group-data-[state=open]:rotate-180" />
              </div>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="border-t border-line px-5 py-4">
            {semester.subjects.length === 0 ? (
              <p className="text-sm leading-7 text-slate">
                Subject-level marks are not available for this semester yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {semester.subjects.map((subject) => {
                  const subjectStatus = getSubjectStatus(subject, semester.cop_subjects);

                  return (
                    <div
                      key={subject.id}
                      className="rounded-[1.125rem] bg-app/70 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs uppercase tracking-[0.16em] text-mist">
                            {subject.code ?? "Subject"}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-ink">
                            {subject.name ?? "Untitled subject"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold tracking-[-0.03em] text-ink">
                            {subject.total_marks ?? "--"}
                          </div>
                          <div className="text-xs text-slate">Grade {subject.grade ?? "--"}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate">
                        <span>Internal {subject.internal_marks ?? "--"}</span>
                        <span>External {subject.external_marks ?? "--"}</span>
                        <span
                          className={cn(
                            "text-right font-semibold uppercase tracking-[0.14em]",
                            subjectStatus.className
                          )}
                        >
                          {subjectStatus.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}
