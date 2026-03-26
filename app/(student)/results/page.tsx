"use client";

import { AppShell } from "@/components/app-shell";
import { ClientRedirect } from "@/components/client-redirect";
import { SectionBlock } from "@/components/section-block";
import { SemesterCards } from "@/components/semester-card";
import { StatusBadge } from "@/components/status-badge";
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

  const summary = snapshot.results_view;
  const latestSemester = dashboard.semesters[0] ?? null;

  return (
    <AppShell eyebrow="Detailed records" title="Results">
      <SectionBlock title="Semester archive">
        <SemesterCards semesters={dashboard.semesters} />
      </SectionBlock>
    </AppShell>
  );
}
