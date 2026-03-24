import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SectionBlock } from "@/components/section-block";
import { SemesterCards } from "@/components/semester-card";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUserWithLink } from "@/lib/current-user-link";
import { getResultsSummary } from "@/lib/dashboard-view";
import { getDashboardForStudent } from "@/lib/queries/dashboard";

export default async function ResultsPage() {
  const { link } = await getCurrentUserWithLink();
  if (!link || link.status !== "linked") {
    redirect("/");
  }

  const dashboard = link.student_id ? await getDashboardForStudent(link.student_id) : null;
  if (!dashboard) {
    redirect("/");
  }

  const summary = getResultsSummary(dashboard);
  const latestSemester = dashboard.semesters[0] ?? null;

  return (
    <AppShell eyebrow="Detailed records" title="Results">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)]">
        <SectionBlock
          title="Reading mode"
          description="The summary rail and semester accordion now read directly from the linked academic record."
          className="xl:sticky xl:top-8 xl:self-start"
        >
          <div className="space-y-3 text-sm leading-7 text-slate">
            <p>
              One latest result row is shown per semester so carry-paper reruns do not duplicate the same
              semester in the interface.
            </p>
            <p>
              Subject cards use the actual marks, grades, and back-paper flags stored against each latest
              semester result.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3">
            <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Latest declaration</div>
              <div className="mt-2 text-lg font-semibold text-ink">{summary.latestSemesterLabel}</div>
              <div className="mt-1 text-sm text-slate">{summary.latestDeclaration}</div>
            </div>
            <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Academic state</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge tone={dashboard.metrics.active_backs === 0 ? "success" : "warning"}>
                  Active backs: {dashboard.metrics.active_backs}
                </StatusBadge>
                <StatusBadge tone="accent">{summary.bestSemesterLabel}</StatusBadge>
                {latestSemester?.session_type ? (
                  <StatusBadge tone="info">{latestSemester.session_type}</StatusBadge>
                ) : null}
              </div>
            </div>
          </div>
        </SectionBlock>
        <SectionBlock
          title="Semester archive"
          description="Each card shows the latest stored outcome for that semester, with subject-wise marks underneath."
        >
          <SemesterCards semesters={dashboard.semesters} />
        </SectionBlock>
      </div>
    </AppShell>
  );
}
