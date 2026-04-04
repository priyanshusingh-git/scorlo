"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

const issueTypeOptions = [
  { value: "wrong_data", label: "Wrong data" },
  { value: "missing_record", label: "Missing record" },
  { value: "link_problem", label: "Link problem" },
  { value: "account_issue", label: "Account issue" },
  { value: "other", label: "Other" }
] as const;

export function StudentSupportForm() {
  const [issueType, setIssueType] = useState<(typeof issueTypeOptions)[number]["value"]>("wrong_data");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/support/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          issueType,
          title,
          description
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to submit the issue.");
      }

      setTitle("");
      setDescription("");
      setIssueType("wrong_data");
      setMessage(payload?.message ?? "Issue submitted.");
      window.dispatchEvent(
        new CustomEvent("student-support-issues:refresh", {
          detail: { resetToFirstPage: true }
        })
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit the issue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        <select
          value={issueType}
          onChange={(event) => setIssueType(event.target.value as typeof issueType)}
          className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          disabled={pending}
        >
          {issueTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          placeholder="Short issue title"
          disabled={pending}
        />
      </div>

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="min-h-36 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
        placeholder="Describe what is wrong, missing, or blocked. Include semester or subject code if relevant."
        disabled={pending}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          <span>{pending ? "Submitting..." : "Submit issue"}</span>
        </button>
        {message ? <p className="text-sm text-slate">{message}</p> : null}
      </div>
    </form>
  );
}
