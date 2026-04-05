"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast-provider";
import { formatDateTimeLabel } from "@/lib/format-date";
import type { AdminSupportIssueRow, SupportIssueStatus, SupportIssueType } from "@/lib/queries/support";

const issueTypeLabels: Record<SupportIssueType, string> = {
  wrong_data: "Wrong data",
  missing_record: "Missing record",
  link_problem: "Link problem",
  account_issue: "Account issue",
  other: "Other"
};

const statusLabels: Record<SupportIssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  dismissed: "Dismissed"
};

function statusTone(status: SupportIssueStatus) {
  if (status === "resolved") return "success" as const;
  if (status === "in_progress") return "warning" as const;
  if (status === "dismissed") return "danger" as const;
  return "accent" as const;
}

function IssueCard({ issue }: { issue: AdminSupportIssueRow }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [status, setStatus] = useState<SupportIssueStatus>(issue.status);
  const [notes, setNotes] = useState(issue.admin_notes ?? "");
  const [pending, setPending] = useState(false);

  async function handleSave() {
    setPending(true);

    try {
      const response = await fetch(`/api/admin/issues/${issue.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          adminNotes: notes.trim() || null
        })
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to update the issue.");
      }

      pushToast({
        tone: "success",
        title: payload?.message ?? "Issue updated.",
        description: "Support queue state has been refreshed."
      });
      router.refresh();
    } catch (error) {
      pushToast({
        tone: "error",
        title: "Unable to update issue",
        description: error instanceof Error ? error.message : "Unable to update the issue."
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-[1.35rem] border border-line bg-surface px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-ink">{issue.title}</div>
          <div className="text-xs text-slate">
            {issue.email}
            {issue.student_name ? ` • ${issue.student_name}` : ""}
            {issue.roll_no ? ` • ${issue.roll_no}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={statusTone(issue.status)}>{statusLabels[issue.status]}</StatusBadge>
          <StatusBadge tone="info">{issueTypeLabels[issue.issue_type]}</StatusBadge>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate">{issue.description}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as SupportIssueStatus)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          disabled={pending}
        >
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-24 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="Admin notes"
          disabled={pending}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          <span>{pending ? "Saving..." : "Save update"}</span>
        </button>
        <span className="text-xs text-slate">
          Reported {formatDateTimeLabel(issue.created_at)}
          {issue.link_status ? ` • Link ${issue.link_status}` : ""}
        </span>
      </div>
    </div>
  );
}

export function AdminSupportIssuesBoard({ issues }: { issues: AdminSupportIssueRow[] }) {
  return (
    <div className="space-y-4">
      {issues.length > 0 ? (
        issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
      ) : (
        <div className="rounded-[1.2rem] border border-dashed border-line bg-surface px-4 py-6 text-sm text-slate">
          No student issues have been submitted yet.
        </div>
      )}
    </div>
  );
}
