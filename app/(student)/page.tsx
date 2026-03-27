"use client";

import { LinkStudentForm } from "@/components/link-student-form";
import { PendingVerification } from "@/components/pending-verification";
import { AppShell } from "@/components/app-shell";
import { HeroCard } from "@/components/hero-card";
import { MetricTile } from "@/components/metric-tile";
import { ProgressChart } from "@/components/progress-chart";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { useStudentShell } from "@/components/student-shell-provider";

/* Definitive Layout: 'Current standing' reordered before 'Progress' for a high-impact arrival */
export default function HomePage() {
  const { user, link, snapshot } = useStudentShell();
  const needsLink = !link;
  const isPending = link?.status === "pending_data" || link?.status === "rejected";
  const dashboard = snapshot?.dashboard ?? null;
  const homeView = snapshot?.home_view ?? null;
  const latestSemester = dashboard?.semesters[0] ?? null;

  return (
    <AppShell eyebrow="Student portal" title="Home">
      {needsLink ? (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <SectionBlock
            title="Complete your academic link"
            className="xl:sticky xl:top-8 xl:self-start"
          >
            <LinkStudentForm link={link} email={user.email ?? null} />
          </SectionBlock>

          <SectionBlock title="Next steps">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="surface-2 rounded-[1.35rem] border border-line px-4 py-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Step 1</div>
                <div className="mt-2 text-lg font-semibold text-ink">Enter roll number</div>
              </div>
              <div className="surface-2 rounded-[1.35rem] border border-line px-4 py-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Step 2</div>
                <div className="mt-2 text-lg font-semibold text-ink">Confirm date of birth</div>
              </div>
              <div className="surface-2 rounded-[1.35rem] border border-line px-4 py-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Step 3</div>
                <div className="mt-2 text-lg font-semibold text-ink">Unlock dashboard</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge tone="info">Student access</StatusBadge>
              <StatusBadge tone="accent">Academic profile</StatusBadge>
              <StatusBadge tone="warning">Review if not found</StatusBadge>
            </div>
          </SectionBlock>
        </section>
      ) : isPending ? (
        <PendingVerification rollNo={link?.roll_no ?? null} />
      ) : !dashboard ? (
        <SectionBlock title="Academic record unavailable">
          <p className="text-sm leading-7 text-slate">
            Try refreshing once. If the issue persists, check again in a moment.
          </p>
        </SectionBlock>
      ) : (
        <>
          <HeroCard
            name={dashboard.student.name ?? user.email ?? "Student"}
          />

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {homeView?.metric_tiles.map((metric) => (
              <MetricTile key={metric.label} metric={metric} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.35fr)]">
            <SectionBlock
              title="Current standing"
              className="h-full"
            >
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={homeView?.standing.active_backs_tone ?? "warning"}>
                  {homeView?.standing.active_backs_label ?? `Active backs: ${dashboard.metrics.active_backs}`}
                </StatusBadge>
                <StatusBadge tone="accent">
                  {homeView?.standing.cleared_backs_label ?? `Cleared backs: ${dashboard.metrics.cleared_backs}`}
                </StatusBadge>
                <StatusBadge tone="info">
                  {homeView?.standing.latest_result_label ??
                    (latestSemester
                      ? `Latest result: Semester ${latestSemester.semester_no}`
                      : "No semester result yet")}
                </StatusBadge>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="surface-2 rounded-[1.35rem] border border-line px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Best semester</div>
                  <div className="mt-2 text-lg font-semibold text-ink">
                    {homeView?.standing.best_semester_label ?? "Not available"}
                  </div>
                </div>
                <div className="surface-2 rounded-[1.35rem] border border-line px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Latest status</div>
                  <div className="mt-2 text-lg font-semibold text-ink">
                    {homeView?.standing.latest_status_label ?? "Unknown"}
                  </div>
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Progress">
              <ProgressChart
                chart={
                  homeView?.progress_chart ?? {
                    points: [],
                    peak_label: "--",
                    path: "",
                    fill_path: "",
                    coordinates: []
                  }
                }
              />
            </SectionBlock>
          </section>
        </>
      )}
    </AppShell>
  );
}
