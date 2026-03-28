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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/support/issues", {
        cache: "no-store"
      });
      const payload = (await response.json().catch(() => null)) as
        | { issues?: StudentSupportIssueRow[]; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to load support issues.");
      }

      setIssues(payload?.issues ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load support issues.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  useEffect(() => {
    const handleRefresh = () => {
      void loadIssues();
    };

    window.addEventListener("student-support-issues:refresh", handleRefresh);
    return () => {
      window.removeEventListener("student-support-issues:refresh", handleRefresh);
    };
  }, [loadIssues]);

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
    </div>
  );
}
