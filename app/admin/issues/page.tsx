import { AdminSupportIssuesBoard } from "@/components/admin-support-issues-board";
import { SectionBlock } from "@/components/section-block";
import { requireMainAdminSession } from "@/lib/auth/admin";
import { listSupportIssuesForAdmin } from "@/lib/queries/support";

export default async function AdminIssuesPage() {
  await requireMainAdminSession();
  const issues = await listSupportIssuesForAdmin();

  return (
    <>
      <SectionBlock
        title="Support queue"
        description="Track record corrections, missing results, link problems, and other student-reported issues."
      >
        <AdminSupportIssuesBoard issues={issues} />
      </SectionBlock>
    </>
  );
}
