import { notFound } from "next/navigation";
import { AdminDangerButton } from "@/components/admin-actions";
import { AdminStudentExportTrigger } from "@/components/admin-student-export-trigger";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { isMainAdminUser, requireAdminSession } from "@/lib/auth/admin";
import { formatBranchLabel } from "@/lib/branch-label";
import { getAdminStudentDetailForScope } from "@/lib/queries/admin";
import { getRankingsForStudent } from "@/lib/queries/rankings";
import { getBranchScopedAccess } from "@/lib/staff-access";

type PageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function AdminStudentProfilePage({ params }: PageProps) {
  const admin = await requireAdminSession();
  const isMainAdmin = isMainAdminUser(admin);
  const scopedBranch = getBranchScopedAccess(admin);
  const { studentId } = await params;
  const parsedStudentId = Number(studentId);

  if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
    notFound();
  }

  const detail = await getAdminStudentDetailForScope(parsedStudentId, scopedBranch);

  if (!detail) {
    notFound();
  }

  const rankings = await getRankingsForStudent(parsedStudentId);

  return (
    <div className="animate-route-content-in space-y-5 lg:space-y-6">
      <SectionBlock
        title={detail.name ?? "Unnamed student"}
        actions={
          <AdminStudentExportTrigger
            mode="single"
            studentId={detail.id}
            studentLabel={detail.name ?? detail.roll_no}
          />
        }
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={detail.linked_app_user_id ? "success" : "warning"}>
            {detail.linked_app_user_id ? "Linked" : "Unlinked"}
          </StatusBadge>
          {detail.passing_year ? <StatusBadge tone="info">Batch {detail.passing_year}</StatusBadge> : null}
          {detail.branch_name ? <StatusBadge tone="info">{formatBranchLabel(detail.branch_name)}</StatusBadge> : null}
          <StatusBadge tone="accent">{detail.roll_no}</StatusBadge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <InfoTile label="CGPA" value={detail.cgpa ?? "--"} />
          <InfoTile label="Overall %" value={detail.overall_percentage ?? "--"} />
          <InfoTile label="Active backs" value={String(detail.active_backs)} />
          <InfoTile label="Cleared backs" value={String(detail.cleared_backs)} />
        </div>
      </SectionBlock>

      <SectionBlock title="Rankings">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RankingScopeCard
            title="Branch ranking"
            metricRank={rankings?.scopes.branch.metrics.cgpa.self_rank ?? null}
            percentageRank={rankings?.scopes.branch.metrics.percentage.self_rank ?? null}
          />
          <RankingScopeCard
            title="Batch ranking"
            metricRank={rankings?.scopes.batch.metrics.cgpa.self_rank ?? null}
            percentageRank={rankings?.scopes.batch.metrics.percentage.self_rank ?? null}
          />
        </div>
      </SectionBlock>

      <SectionBlock title="Semesters">
        <div className="space-y-3">
          {detail.recent_semesters.map((semester) => {
            const branchSemesterRank =
              rankings?.scopes.branch.semester_metrics.find((item) => item.semester_no === semester.semester_no) ?? null;
            const batchSemesterRank =
              rankings?.scopes.batch.semester_metrics.find((item) => item.semester_no === semester.semester_no) ?? null;

            return (
              <div
                key={semester.semester_no}
                className="rounded-[1.1rem] border border-line bg-surface px-4 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-ink">Semester {semester.semester_no}</div>
                  <StatusBadge tone="info">{normalizeSemesterStatus(semester.result_status)}</StatusBadge>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <InfoTile label="SGPA" value={semester.sgpa ?? "--"} />
                  <InfoTile
                    label="Branch rank"
                    value={formatRankValue(branchSemesterRank?.self_rank ?? null)}
                  />
                  <InfoTile
                    label="Batch rank"
                    value={formatRankValue(batchSemesterRank?.self_rank ?? null)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionBlock>

      {isMainAdmin ? (
        <SectionBlock title="Danger zone">
          <AdminDangerButton
            label="Delete student academic record"
            url={`/api/admin/students/${detail.id}`}
            confirmMessage={`Delete the academic record for ${detail.roll_no}? This removes dependent academic tables and resets any linked app account.`}
            successMessage="Student record deleted."
          />
        </SectionBlock>
      ) : null}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-line bg-surface px-3 py-3 sm:px-4">
      <div className="text-[10px] uppercase tracking-[0.12em] text-mist sm:text-[11px] sm:tracking-[0.16em]">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-ink sm:text-[0.95rem]">{value}</div>
    </div>
  );
}

function RankingScopeCard({
  title,
  metricRank,
  percentageRank,
}: {
  title: string;
  metricRank: number | null;
  percentageRank: number | null;
}) {
  return (
    <div className="rounded-[1.1rem] border border-line bg-surface px-4 py-4">
      <div className="text-sm font-semibold text-ink">{title}</div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <InfoTile label="CGPA rank" value={formatRankValue(metricRank)} />
        <InfoTile label="Percentage rank" value={formatRankValue(percentageRank)} />
      </div>
    </div>
  );
}

function formatRankValue(rank: number | null) {
  if (!rank) return "--";
  return `#${rank}`;
}

function normalizeSemesterStatus(value: string | null) {
  const raw = (value ?? "").trim();
  const normalized = raw.toUpperCase();

  if (!normalized || normalized === "PASS") {
    return "Pass";
  }

  if (normalized.replace(/\s+/g, "").includes("CP(0)")) {
    return "Pass";
  }

  return raw || "Unknown";
}
