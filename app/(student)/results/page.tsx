"use client";

import { AppShell } from "@/components/app-shell";
import { ClientRedirect } from "@/components/client-redirect";
import { ResultsSummaryActions } from "@/components/results-summary-actions";
import { SectionBlock } from "@/components/section-block";
import { SemesterCards } from "@/components/semester-card";
import { useStudentShell } from "@/components/student-shell-provider";

export default function ResultsPage() {
  const { link, snapshot } = useStudentShell();

  if (!link || link.status !== "linked") {
    return <ClientRedirect href="/" />;
  }

  const dashboard = snapshot?.dashboard ?? null;
  if (!dashboard || !snapshot) {
    return <ClientRedirect href="/" />;
  }

  return (
    <AppShell eyebrow="Semester records" title="Results">
      <SectionBlock title="Summary actions">
        <ResultsSummaryActions snapshot={snapshot} />
      </SectionBlock>

      <SectionBlock title="Semester archive">
        <SemesterCards semesters={dashboard.semesters} />
      </SectionBlock>
    </AppShell>
  );
}
