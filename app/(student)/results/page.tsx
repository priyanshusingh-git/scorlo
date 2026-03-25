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
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)]">
        <SectionBlock
          title="Reading mode"
          className="xl:sticky xl:top-8 xl:self-start"
        >
          <div className="space-y-3 text-sm leading-7 text-slate">
            <p>
              Each semester appears once so your archive stays clear and easy to scan.
            </p>
            <p>
              Open any semester to review subject-wise marks, grades, and outcome labels.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3">
            <div className="glass-card rounded-[1.35rem] border border-white/70 px-4 py-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Latest declaration</div>
              <div className="mt-2 text-lg font-semibold text-ink">{summary.latest_semester_label}</div>
              <div className="mt-1 text-sm text-slate">{summary.latest_declaration}</div>
            </div>
            <div className="glass-card rounded-[1.35rem] border border-white/70 px-4 py-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Academic state</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge tone={dashboard.metrics.active_backs === 0 ? "success" : "warning"}>
                  Active backs: {dashboard.metrics.active_backs}
                </StatusBadge>
                <StatusBadge tone="accent">{summary.best_semester_label}</StatusBadge>
                {latestSemester?.session_type ? (
                  <StatusBadge tone="info">{latestSemester.session_type}</StatusBadge>
                ) : null}
              </div>
            </div>
          </div>
        </SectionBlock>
        <SectionBlock title="Semester archive">
          <SemesterCards semesters={dashboard.semesters} />
        </SectionBlock>
      </div>
    </AppShell>
  );
}
