"use client";

import { useStudentShell } from "@/components/student-shell-provider";
import { formatDateTimeLabel } from "@/lib/format-date";

export function StudentDataFreshness() {
  const { snapshot } = useStudentShell();

  if (!snapshot) return null;

  return (
    <div className="surface-2 rounded-[1.2rem] border border-line px-4 py-3 text-sm text-slate">
      Academic data last updated{" "}
      <span className="font-semibold text-ink">
        {formatDateTimeLabel(snapshot.meta.academic_updated_at ?? null)}
      </span>
    </div>
  );
}
