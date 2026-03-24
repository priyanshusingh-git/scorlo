import { LogoutButton } from "@/components/logout-button";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";

export function PendingVerification({
  rollNo
}: {
  rollNo: string | null;
}) {
  return (
    <SectionBlock
      title="Account under verification"
      description="We could not verify your academic record automatically yet."
    >
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="warning">Pending admin review</StatusBadge>
        {rollNo ? <StatusBadge tone="info">{rollNo}</StatusBadge> : null}
      </div>
      <p className="mt-4 text-sm leading-7 text-slate">
        Your account is under verification from the admin. Once the record is confirmed, Scorlo
        will unlock results, rankings, and the rest of the student dashboard.
      </p>
      <div className="mt-5 rounded-[1.2rem] bg-app/70 px-4 py-4 text-sm leading-7 text-slate">
        For now, you can log out and come back later after the academic record has been reviewed.
      </div>
      <LogoutButton className="mt-5 inline-flex items-center gap-2 rounded-[1.2rem] border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink shadow-soft" />
    </SectionBlock>
  );
}
