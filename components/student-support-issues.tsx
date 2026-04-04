"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { formatDateTimeLabel } from "@/lib/format-date";
import { StatusBadge } from "@/components/status-badge";
import type { StudentSupportIssueRow } from "@/lib/queries/support";

const issueTypeLabels = {
  wrong_data: "Wrong data",
  missing_record: "Missing record",
  link_problem: "Link problem",
  account_issue: "Account issue",
  other: "Other"
} as const;

function getStatusTone(status: string) {
  if (status === "resolved") return "success" as const;
  if (status === "in_progress") return "warning" as const;
  if (status === "dismissed") return "danger" as const;
  return "accent" as const;
}

export function StudentSupportIssues() {
  const [issues, setIssues] = useState<StudentSupportIssueRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize)
      });
      const response = await fetch(`/api/support/issues?${searchParams.toString()}`, {
        cache: "no-store"
      });
      const payload = (await response.json().catch(() => null)) as
        | { rows?: StudentSupportIssueRow[]; totalCount?: number; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to load support issues.");
      }

      setIssues(payload?.rows ?? []);
      setTotalCount(payload?.totalCount ?? 0);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load support issues.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const detail = (event as CustomEvent<{ resetToFirstPage?: boolean }>).detail;
      if (detail?.resetToFirstPage) {
        setPage(1);
      } else {
        void loadIssues();
      }
    };

    window.addEventListener("student-support-issues:refresh", handleRefresh);
    return () => {
      window.removeEventListener("student-support-issues:refresh", handleRefresh);
    };
  }, [loadIssues]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span>Loading issues...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate">
          Page {page} of {totalPages}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink"
          >
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      {issues.length > 0 ? (
        issues.map((issue) => (
          <div
            key={issue.id}
            className="rounded-[1.2rem] border border-line bg-surface px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-ink">{issue.title}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <StatusBadge tone={getStatusTone(issue.status)}>
                    {issue.status.replaceAll("_", " ")}
                  </StatusBadge>
                  <StatusBadge tone="info">{issueTypeLabels[issue.issue_type]}</StatusBadge>
                </div>
              </div>
              <div className="text-xs text-slate">{formatDateTimeLabel(issue.created_at)}</div>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate">{issue.description}</p>
            {issue.admin_notes ? (
              <div className="surface-2 mt-3 rounded-[1rem] border border-line px-3 py-3 text-sm text-slate">
                <span className="font-semibold text-ink">Admin note:</span> {issue.admin_notes}
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <p className="text-sm text-slate">No issues submitted yet.</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1 || loading}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages || loading}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
