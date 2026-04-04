import { AdminSupportIssuesBoard } from "@/components/admin-support-issues-board";
import { SectionBlock } from "@/components/section-block";
import { requireMainAdminSession } from "@/lib/auth/admin";
import { listSupportIssuesForAdmin } from "@/lib/queries/support";
import Link from "next/link";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
  }>;
};

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function AdminIssuesPage({ searchParams }: PageProps) {
  await requireMainAdminSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = parsePositiveInt(resolvedSearchParams?.page, 1);
  const pageSize = parsePositiveInt(resolvedSearchParams?.pageSize, 10);
  const issues = await listSupportIssuesForAdmin({ page, pageSize });
  const totalPages = Math.max(1, Math.ceil(issues.totalCount / issues.pageSize));

  function buildHref(nextPage: number, nextPageSize = issues.pageSize) {
    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(nextPageSize)
    });

    return `/admin/issues?${params.toString()}`;
  }

  return (
    <>
      <SectionBlock
        title="Support queue"
        description="Track record corrections, missing results, link problems, and other student-reported issues."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate">
            Page {issues.page} of {totalPages}
          </div>
          <form method="GET" action="/admin/issues" className="flex items-center gap-2">
            <input type="hidden" name="page" value="1" />
            <label className="flex items-center gap-2 text-xs text-slate">
              <span>Rows</span>
              <select
                name="pageSize"
                defaultValue={String(issues.pageSize)}
                className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink"
            >
              Apply
            </button>
          </form>
        </div>

        <AdminSupportIssuesBoard issues={issues.rows} />

        <div className="mt-4 flex items-center justify-end gap-2">
          <Link
            href={buildHref(Math.max(1, issues.page - 1))}
            aria-disabled={issues.page <= 1}
            className={`rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink ${
              issues.page <= 1 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Previous
          </Link>
          <Link
            href={buildHref(Math.min(totalPages, issues.page + 1))}
            aria-disabled={issues.page >= totalPages}
            className={`rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink ${
              issues.page >= totalPages ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Next
          </Link>
        </div>
      </SectionBlock>
    </>
  );
}
