"use client";

import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { StudentSupportForm } from "@/components/student-support-form";
import { StudentSupportIssues } from "@/components/student-support-issues";
import { useStudentShell } from "@/components/student-shell-provider";

export default function SupportPage() {
  const { link } = useStudentShell();

  return (
    <>
      <SectionBlock
        title="Report an issue"
        description="Use this if anything in your academic record is missing, incorrect, or blocked."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {link?.roll_no ? <StatusBadge tone="info">{link.roll_no}</StatusBadge> : null}
          {link?.status ? <StatusBadge tone="accent">{link.status.replaceAll("_", " ")}</StatusBadge> : null}
        </div>
        <StudentSupportForm />
      </SectionBlock>

      <SectionBlock title="Recent issues">
        <StudentSupportIssues />
      </SectionBlock>
    </>
  );
}
