import { redirect } from "next/navigation";
import { LinkStudentForm } from "@/components/link-student-form";
import { PendingVerification } from "@/components/pending-verification";
import { AppShell } from "@/components/app-shell";
import { HeroCard } from "@/components/hero-card";
import { MetricTile } from "@/components/metric-tile";
import { ProgressChart } from "@/components/progress-chart";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUserWithLink } from "@/lib/current-user-link";
import { getStudentAppSnapshot } from "@/lib/queries/dashboard";

export default async function HomePage() {
  const { user, link } = await getCurrentUserWithLink();
  if (user?.role === "admin") {
    redirect("/admin");
  }
  const needsLink = !link;
  const isPending = link?.status === "pending_data" || link?.status === "rejected";
  const snapshot =
    link?.status === "linked" && link.student_id
      ? await getStudentAppSnapshot(link.student_id)
      : null;
  const dashboard = snapshot?.dashboard ?? null;
  const homeView = snapshot?.home_view ?? null;
  const latestSemester = dashboard?.semesters[0] ?? null;

  return (
    <AppShell eyebrow="Student portal" title="Home">
      {needsLink ? (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <SectionBlock
            title="Complete your academic link"
            description="Login is done. The next step is attaching this account to your AKTU record."
            className="xl:sticky xl:top-8 xl:self-start"
          >
            <LinkStudentForm link={link} email={user?.email ?? null} />
          </SectionBlock>

          <SectionBlock
            title="What happens next"
            description="Scorlo needs your academic identifier before it can show results, rankings, or progress."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Step 1</div>
                <div className="mt-2 text-lg font-semibold text-ink">Enter roll number</div>
              </div>
              <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Step 2</div>
                <div className="mt-2 text-lg font-semibold text-ink">Confirm date of birth</div>
              </div>
              <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Step 3</div>
                <div className="mt-2 text-lg font-semibold text-ink">Unlock dashboard</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge tone="info">Protected account</StatusBadge>
              <StatusBadge tone="accent">Neon lookup</StatusBadge>
              <StatusBadge tone="warning">Pending request if not found</StatusBadge>
            </div>
          </SectionBlock>
        </section>
      ) : isPending ? (
        <PendingVerification rollNo={link?.roll_no ?? null} />
      ) : !dashboard ? (
        <SectionBlock
          title="Academic record unavailable"
          description="The account is linked, but the detailed student dashboard could not be loaded from Neon."
        >
          <p className="text-sm leading-7 text-slate">
            Try refreshing once. If the issue persists, the student link exists but the academic tables
            do not have a complete record for this student yet.
          </p>
        </SectionBlock>
      ) : (
        <>
          <HeroCard
            name={dashboard.student.name ?? user?.email ?? "Student"}
            summary={homeView?.hero.summary ?? "Academic record synced from Neon."}
            branch={dashboard.student.branch_name}
            rollNo={dashboard.student.roll_no}
            status={homeView?.hero.status ?? "Linked"}
            primarySignalLabel={homeView?.hero.latest_signal_label ?? "Latest SGPA"}
            primarySignal={homeView?.hero.latest_signal_value ?? "--"}
            primarySignalHint={homeView?.hero.latest_signal_hint ?? "Academic signal"}
            totalSemesters={dashboard.semesters.length}
            institute={dashboard.student.institute_name}
          />

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {homeView?.metric_tiles.map((metric) => (
              <MetricTile key={metric.label} metric={metric} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
            <SectionBlock
              title="Progress story"
              description="This chart now reads the stored semester SGPA trail directly from the academic database."
            >
              <ProgressChart chart={homeView?.progress_chart ?? { points: [], peak_label: "--", path: "", fill_path: "", coordinates: [] }} />
            </SectionBlock>

            <SectionBlock
              title="Current standing"
              description="Live academic status derived from the linked student record."
              className="h-full"
            >
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={homeView?.standing.active_backs_tone ?? "warning"}>
                  {homeView?.standing.active_backs_label ?? `Active backs: ${dashboard.metrics.active_backs}`}
                </StatusBadge>
                <StatusBadge tone="accent">{homeView?.standing.cleared_backs_label ?? `Cleared backs: ${dashboard.metrics.cleared_backs}`}</StatusBadge>
                <StatusBadge tone="info">
                  {homeView?.standing.latest_result_label ??
                    (latestSemester
                      ? `Latest result: Semester ${latestSemester.semester_no}`
                      : "No semester result yet")}
                </StatusBadge>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate">
                {homeView?.standing.trend_note}
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Best semester</div>
                  <div className="mt-2 text-lg font-semibold text-ink">
                    {homeView?.standing.best_semester_label ?? "Not available"}
                  </div>
                </div>
                <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Latest status</div>
                  <div className="mt-2 text-lg font-semibold text-ink">
                    {homeView?.standing.latest_status_label ?? "Unknown"}
                  </div>
                </div>
              </div>
            </SectionBlock>
          </section>
        </>
      )}
    </AppShell>
  );
}
