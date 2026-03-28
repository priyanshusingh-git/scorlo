"use client";

import { AppShell } from "@/components/app-shell";
import { LinkStudentForm } from "@/components/link-student-form";
import { PendingVerification } from "@/components/pending-verification";
import { SectionBlock } from "@/components/section-block";
import { useStudentShell } from "@/components/student-shell-provider";

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="surface-2 rounded-[1.35rem] border border-line px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-mist">{label}</div>
      <div className="mt-1.5 text-sm font-semibold text-ink">{value ?? "Not available"}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, link, snapshot } = useStudentShell();
  const isLinked = link?.status === "linked";
  const isPending = link?.status === "pending_data" || link?.status === "rejected";
  const student = snapshot?.dashboard?.student ?? null;

  return (
    <AppShell eyebrow="Student account" title="Profile">
      <SectionBlock title="Student Profile">
        {!link ? (
          <LinkStudentForm link={link} email={user.email ?? null} />
        ) : isPending ? (
          <PendingVerification rollNo={link?.roll_no ?? null} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ProfileField label="Name" value={student?.name} />
            <ProfileField label="Email" value={user.email} />
            <ProfileField label="Roll Number" value={student?.roll_no ?? link?.roll_no} />
            <ProfileField label="Branch" value={student?.branch_name} />
            <ProfileField label="Course" value={student?.course_name} />
            <ProfileField label="Institute" value={student?.institute_name} />
          </div>
        )}
      </SectionBlock>
    </AppShell>
  );
}
