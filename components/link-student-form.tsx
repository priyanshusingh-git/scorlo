"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, LoaderCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast-provider";

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
  const { pushToast } = useToast();
  const datePickerRef = useRef<HTMLInputElement | null>(null);
  const [rollNo, setRollNo] = useState(link?.roll_no ?? "");
  const [dob, setDob] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

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

      pushToast({
        tone: payload?.link?.status === "linked" ? "success" : "info",
        title:
          payload?.message ??
          (payload?.link?.status === "linked"
            ? "Academic record linked successfully."
            : "Verification request submitted."),
        description:
          payload?.link?.status === "linked"
            ? "Your dashboard will now reflect the linked academic profile."
            : "Your profile will stay pending until an admin reviews the request."
      });
      setDob("");
      router.refresh();
    } catch (error) {
      pushToast({
        tone: "error",
        title: "Unable to link academic record",
        description: error instanceof Error ? error.message : "Unable to link your academic record."
      });
    } finally {
      setPending(false);
    }
  }

  function formatDobInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  }

  function formatDateValue(value: string) {
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "";
    return `${day}-${month}-${year}`;
  }

  function parseDobToDateInput(value: string) {
    const parts = value.split("-");
    if (parts.length !== 3) return "";
    const [day, month, year] = parts;
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return "";
    return `${year}-${month}-${day}`;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone={statusTone(link?.status ?? null)}>
          {statusLabel(link?.status ?? null)}
        </StatusBadge>
        {email ? <StatusBadge tone="info">{email}</StatusBadge> : null}
      </div>

      <div className="surface-2 rounded-[1.35rem] border border-line px-4 py-4 text-sm leading-7 text-slate">
        Enter your AKTU roll number and date of birth in `DD-MM-YYYY` format to connect your
        academic profile.
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          inputMode="numeric"
          value={rollNo}
          onChange={(event) => setRollNo(event.target.value)}
          placeholder="AKTU roll number"
          className="surface-2 w-full rounded-[1.25rem] border border-line px-4 py-4 text-sm text-ink outline-none placeholder:text-mist"
          minLength={8}
          maxLength={32}
          required
        />
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={dob}
            onChange={(event) => setDob(formatDobInput(event.target.value))}
            placeholder="DD-MM-YYYY"
            className="surface-2 w-full rounded-[1.25rem] border border-line px-4 py-4 pr-14 text-sm text-ink outline-none placeholder:text-mist"
            pattern="\d{2}-\d{2}-\d{4}"
            maxLength={10}
            required
          />
          <input
            ref={datePickerRef}
            type="date"
            value={parseDobToDateInput(dob)}
            onChange={(event) => setDob(formatDateValue(event.target.value))}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          />
          <button
            type="button"
            onClick={() => {
              const dateInput = datePickerRef.current;
              if (!dateInput) return;
              if (typeof dateInput.showPicker === "function") {
                dateInput.showPicker();
              } else {
                dateInput.focus();
                dateInput.click();
              }
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-mist transition hover:bg-app/70 hover:text-ink"
            aria-label="Choose date of birth"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-ink px-4 py-4 text-sm font-semibold text-white shadow-[0_24px_45px_-28px_rgba(9,17,27,0.88)] disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {pending ? "Linking..." : link ? "Update academic link" : "Link academic record"}
          {!pending ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </form>

      {link?.roll_no ? (
        <div className="surface-2 rounded-[1.25rem] border border-line px-4 py-4 text-sm leading-7 text-slate">
          Current roll number on this account: <span className="font-semibold text-ink">{link.roll_no}</span>
        </div>
      ) : null}

    </div>
  );
}
