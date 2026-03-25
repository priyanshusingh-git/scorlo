"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LoaderCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

type LinkState = {
  student_link_id: number | null;
  status: "linked" | "pending_data" | "rejected" | null;
  roll_no: string | null;
  student_id: number | null;
};

function statusTone(status: LinkState["status"]) {
  switch (status) {
    case "linked":
      return "success";
    case "pending_data":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "info";
  }
}

function statusLabel(status: LinkState["status"]) {
  switch (status) {
    case "linked":
      return "Linked";
    case "pending_data":
      return "Pending data";
    case "rejected":
      return "Rejected";
    default:
      return "Awaiting link";
  }
}

export function LinkStudentForm({
  link,
  email
}: {
  link: LinkState | null;
  email: string | null;
}) {
  const router = useRouter();
  const [rollNo, setRollNo] = useState(link?.roll_no ?? "");
  const [dob, setDob] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);

    try {
      const response = await fetch("/api/link-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNo, dob })
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string; link?: LinkState }
        | null;

      if (!response.ok) {
        const errorMsg = payload?.message ?? "Unable to link your academic record.";
        const details = (payload as any)?.details;
        throw new Error(details ? `${errorMsg} (${details})` : errorMsg);
      }

      setStatus(
        payload?.message ??
          (payload?.link?.status === "linked"
            ? "Academic record linked successfully."
            : "Your account is under verification from the admin.")
      );
      setDob("");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to link your academic record.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone={statusTone(link?.status ?? null)}>
          {statusLabel(link?.status ?? null)}
        </StatusBadge>
        {email ? <StatusBadge tone="info">{email}</StatusBadge> : null}
      </div>

      <div className="rounded-[1.25rem] bg-app/70 px-4 py-4 text-sm leading-7 text-slate">
        Enter your AKTU roll number and date of birth in `DD-MM-YYYY` format. If the roll number
        exists in the academic database, your account will be linked immediately and the DOB will
        be stored in the database. Otherwise it will move to admin verification.
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          inputMode="numeric"
          value={rollNo}
          onChange={(event) => setRollNo(event.target.value)}
          placeholder="AKTU roll number"
          className="w-full rounded-[1.2rem] border border-line bg-surface-muted/70 px-4 py-4 text-sm text-ink outline-none placeholder:text-mist"
          minLength={8}
          maxLength={32}
          required
        />
        <input
          type="text"
          inputMode="numeric"
          value={dob}
          onChange={(event) => setDob(event.target.value)}
          placeholder="DD-MM-YYYY"
          className="w-full rounded-[1.2rem] border border-line bg-surface-muted/70 px-4 py-4 text-sm text-ink outline-none placeholder:text-mist"
          pattern="\d{2}-\d{2}-\d{4}"
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-accent-strong px-4 py-4 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {pending ? "Linking..." : link ? "Update academic link" : "Link academic record"}
          {!pending ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </form>

      {link?.roll_no ? (
        <div className="rounded-[1.2rem] border border-line bg-surface/80 px-4 py-4 text-sm leading-7 text-slate">
          Current roll number on this account: <span className="font-semibold text-ink">{link.roll_no}</span>
        </div>
      ) : null}

      {status ? <p className="text-sm leading-6 text-slate">{status}</p> : null}
    </div>
  );
}
