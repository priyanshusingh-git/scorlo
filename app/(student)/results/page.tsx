"use client";

import { ClientRedirect } from "@/components/client-redirect";
import { ResultsSummaryActions } from "@/components/results-summary-actions";
import { SectionBlock } from "@/components/section-block";
import { SemesterCards } from "@/components/semester-card";
import { useStudentShell } from "@/components/student-shell-provider";

export default function ResultsPage() {
  const { link, snapshot } = useStudentShell();

  if (!link || link.status !== "linked") {
    return <ClientRedirect href="/profile" />;
  }

  const dashboard = snapshot?.dashboard ?? null;
  if (!dashboard || !snapshot) {
    return <ClientRedirect href="/profile" />;
  }

  return (
    <>
      <SectionBlock
        title="Semester archive"
        actions={<ResultsSummaryActions snapshot={snapshot} />}
      >
        <SemesterCards semesters={dashboard.semesters} />
      </SectionBlock>
    </>
  );
}
