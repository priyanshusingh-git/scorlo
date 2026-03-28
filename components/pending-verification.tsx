import Link from "next/link";
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
        Your account is under review. Once the record is confirmed, the rest of your workspace
        will unlock automatically.
      </p>
      <div className="surface-2 mt-5 rounded-[1.35rem] border border-line px-4 py-4 text-sm leading-7 text-slate">
        For now, you can log out and come back later after the academic record has been reviewed.
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/support"
          className="inline-flex items-center gap-2 rounded-[1.2rem] bg-ink px-4 py-3 text-sm font-semibold text-white"
        >
          Report an issue
        </Link>
        <LogoutButton className="surface-2 inline-flex items-center gap-2 rounded-[1.2rem] border border-line px-4 py-3 text-sm font-semibold text-ink shadow-soft" />
      </div>
    </SectionBlock>
  );
}
