import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LinkStudentForm } from "@/components/link-student-form";
import { PendingVerification } from "@/components/pending-verification";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUserWithLink } from "@/lib/current-user-link";
import { getDashboardForStudent } from "@/lib/queries/dashboard";

export default async function ProfilePage() {
  const { user, link } = await getCurrentUserWithLink();
  if (user?.role === "admin") {
    redirect("/admin");
  }
  const isLinked = link?.status === "linked";
  const dashboard =
    isLinked && link?.student_id ? await getDashboardForStudent(link.student_id) : null;
  const student = dashboard?.student ?? null;

  return (
    <AppShell eyebrow="Account state" title="Profile">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <SectionBlock
          title={student?.name ?? "Student account"}
          description={user?.email ?? "Signed-in account"}
          className="xl:sticky xl:top-8 xl:self-start"
        >
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="success">Email verified</StatusBadge>
            <StatusBadge tone={isLinked ? "success" : "warning"}>
              {isLinked ? "Linked to AKTU" : "Link required"}
            </StatusBadge>
            <StatusBadge tone="info">Firebase auth</StatusBadge>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Primary device</div>
              <div className="mt-2 text-lg font-semibold text-ink">PWA ready</div>
            </div>
            <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
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
                <p>This account is linked to a live academic record in Neon.</p>
                <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Institute</div>
                  <div className="mt-2 text-sm font-semibold text-ink">
                    {student?.institute_name ?? "Not available"}
                  </div>
                </div>
                <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Course</div>
                  <div className="mt-2 text-sm font-semibold text-ink">
                    {student?.course_name ?? "Not available"}
                  </div>
                </div>
              </div>
            ) : (
              <LinkStudentForm link={link} email={user?.email ?? null} />
            )}
          </SectionBlock>

          <SectionBlock
            title="Request status"
            description={
              link?.status === "pending_data"
                ? "A data request is pending because the student record was not found immediately."
                : "No pending ingestion request exists for this account."
            }
          >
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={link?.status === "pending_data" ? "warning" : "success"}>
                {link?.status === "pending_data" ? "Pending review" : "All clear"}
              </StatusBadge>
              <StatusBadge tone="info">Last sync today</StatusBadge>
            </div>
          </SectionBlock>

          <SectionBlock
            title="Security"
            description="The current account session is handled through Firebase cookies and protected server-side reads."
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Auth</div>
                <div className="mt-2 text-sm font-semibold text-ink">Firebase session</div>
              </div>
              <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Identity</div>
                <div className="mt-2 text-sm font-semibold text-ink">Email verified</div>
              </div>
              <div className="rounded-[1.2rem] bg-app/70 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Data</div>
                <div className="mt-2 text-sm font-semibold text-ink">Neon-backed</div>
              </div>
            </div>
          </SectionBlock>
        </div>
      </div>
    </AppShell>
  );
}
