"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { DashboardPayload } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export function SemesterCards({
  semesters
}: {
  semesters: DashboardPayload["semesters"];
}) {
  return (
    <Accordion.Root type="single" collapsible className="space-y-3">
      {semesters.map((semester) => {
        return (
          <Accordion.Item
            key={semester.id}
            value={`semester-${semester.semester_no}`}
            className="surface-1 overflow-hidden rounded-[1.75rem] border border-line shadow-[0_22px_55px_-38px_rgba(16,32,49,0.42)]"
          >
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full flex-col gap-4 px-5 py-5 text-left md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-xl font-bold tracking-[-0.04em] text-ink">
                  Semester {semester.semester_no}
                </div>
                <div className="mt-1 text-sm text-slate">
                  SGPA {semester.sgpa ?? "--"} • {semester.total_marks_obtained ?? "--"} marks
                </div>
              </div>
              <div className="flex items-center gap-3 self-start md:self-center">
                <StatusBadge tone={semester.status_badge_tone}>
                  {semester.status_badge_label}
                </StatusBadge>
                <ChevronDown className="h-4 w-4 text-mist transition group-data-[state=open]:rotate-180" />
              </div>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="border-t border-line/70 px-5 py-5">
            {semester.subjects.length === 0 ? (
              <p className="text-sm leading-7 text-slate">
                Subject-level marks are not available for this semester yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {semester.subjects.map((subject) => {
                  return (
                    <div
                      key={subject.id}
                      className="surface-2 rounded-[1.3rem] border border-line px-4 py-4"
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
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate">
                        <span>Internal {subject.internal_marks ?? "--"}</span>
                        <span>External {subject.external_marks ?? "--"}</span>
                        <span
                          className={cn(
                            "text-right font-semibold uppercase tracking-[0.14em]",
                            subject.status_class_name
                          )}
                        >
                          {subject.status_label}
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
