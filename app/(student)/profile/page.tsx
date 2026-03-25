"use client";

import { AppShell } from "@/components/app-shell";
import { LinkStudentForm } from "@/components/link-student-form";
import { PendingVerification } from "@/components/pending-verification";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { useStudentShell } from "@/components/student-shell-provider";

export default function ProfilePage() {
  const { user, link, snapshot } = useStudentShell();
  const isLinked = link?.status === "linked";
  const dashboard = snapshot?.dashboard ?? null;
  const student = dashboard?.student ?? null;

  return (
    <AppShell eyebrow="Account state" title="Profile">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <SectionBlock
          title={student?.name ?? "Student account"}
          description={user.email ?? undefined}
          className="xl:sticky xl:top-8 xl:self-start"
        >
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="success">Email verified</StatusBadge>
            <StatusBadge tone={isLinked ? "success" : "warning"}>
              {isLinked ? "Linked to AKTU" : "Link required"}
            </StatusBadge>
            <StatusBadge tone="info">Student account</StatusBadge>
          </div>
          <div className="mt-5 space-y-3">
            <div className="glass-card rounded-[1.35rem] border border-white/70 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Access</div>
              <div className="mt-2 text-lg font-semibold text-ink">Ready to use</div>
            </div>
            <div className="glass-card rounded-[1.35rem] border border-white/70 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Linked state</div>
              <div className="mt-2 text-lg font-semibold text-ink">
                {isLinked ? "Live with academic profile" : "Awaiting academic link"}
              </div>
            </div>
          </div>
        </SectionBlock>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SectionBlock
            title="Linked record"
            description={
              link?.roll_no
                ? `Roll number ${link.roll_no} • ${student?.branch_name ?? "Branch unavailable"}`
                : "No roll number linked yet"
            }
          >
            {link?.status === "pending_data" || link?.status === "rejected" ? (
              <PendingVerification rollNo={link?.roll_no ?? null} />
            ) : isLinked ? (
              <div className="space-y-3 text-sm leading-7 text-slate">
                <p>This account is connected to your academic profile.</p>
                <div className="glass-card rounded-[1.35rem] border border-white/70 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Institute</div>
                  <div className="mt-2 text-sm font-semibold text-ink">
                    {student?.institute_name ?? "Not available"}
                  </div>
                </div>
                <div className="glass-card rounded-[1.35rem] border border-white/70 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Course</div>
                  <div className="mt-2 text-sm font-semibold text-ink">
                    {student?.course_name ?? "Not available"}
                  </div>
                </div>
              </div>
            ) : (
              <LinkStudentForm link={link} email={user.email ?? null} />
            )}
          </SectionBlock>

          <SectionBlock
            title="Request status"
            description={
              link?.status === "pending_data"
                ? "Under review."
                : "All set."
            }
          >
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={link?.status === "pending_data" ? "warning" : "success"}>
                {link?.status === "pending_data" ? "Pending review" : "All clear"}
              </StatusBadge>
              <StatusBadge tone="info">Last sync today</StatusBadge>
            </div>
          </SectionBlock>

          <SectionBlock title="Security" className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="glass-card rounded-[1.35rem] border border-white/70 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Auth</div>
                <div className="mt-2 text-sm font-semibold text-ink">Signed in</div>
              </div>
              <div className="glass-card rounded-[1.35rem] border border-white/70 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Identity</div>
                <div className="mt-2 text-sm font-semibold text-ink">Email verified</div>
              </div>
              <div className="glass-card rounded-[1.35rem] border border-white/70 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Data</div>
                <div className="mt-2 text-sm font-semibold text-ink">Academic profile</div>
              </div>
            </div>
          </SectionBlock>
        </div>
      </div>
    </AppShell>
  );
}
