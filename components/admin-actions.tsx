"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useToast } from "@/components/toast-provider";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function useConfirmDialog() {
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [dialogState, setDialogState] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
  } | null>(null);

  async function confirm({
    title = "Confirm action",
    description,
    confirmLabel = "Continue"
  }: {
    title?: string;
    description: string;
    confirmLabel?: string;
  }) {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        title,
        description,
        confirmLabel
      });
    });
  }

  function closeWith(result: boolean) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialogState(null);
  }

  const dialog = dialogState ? (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-ink/40 px-4 pb-4 pt-10 backdrop-blur-[2px] sm:items-center">
      <div className="w-full max-w-md rounded-[1.5rem] border border-line bg-surface px-5 py-5 shadow-[0_28px_70px_-34px_rgba(16,32,49,0.48)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-warning-soft p-2 text-warning">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-ink">{dialogState.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate">{dialogState.description}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => closeWith(false)}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-app/60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => closeWith(true)}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            {dialogState.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return {
    confirm,
    dialog
  };
}

function useAdminRequest() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [pending, setPending] = useState(false);

  async function run({
    url,
    method,
    body,
    confirmMessage,
    confirmTitle,
    confirmLabel,
    successMessage
  }: {
    url: string;
    method: "POST" | "PATCH" | "DELETE";
    body?: Record<string, unknown>;
    confirmMessage?: string;
    confirmTitle?: string;
    confirmLabel?: string;
    successMessage?: string;
  }) {
    if (confirmMessage) {
      const confirmed = await confirm({
        title: confirmTitle,
        description: confirmMessage,
        confirmLabel
      });

      if (!confirmed) {
        return false;
      }
    }

    setPending(true);

    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Request failed.");
      }

      pushToast({
        tone: "success",
        title: successMessage ?? payload?.message ?? "Saved."
      });
      router.refresh();
      return true;
    } catch (error) {
      pushToast({
        tone: "error",
        title: "Request failed",
        description: getErrorMessage(error)
      });
      return false;
    } finally {
      setPending(false);
    }
  }

  return { pending, run, dialog };
}

export function AdminUserRoleForm({
  userId,
  currentRole
}: {
  userId: number;
  currentRole: "student" | "admin";
}) {
  const [role, setRole] = useState(currentRole);
  const { pending, run, dialog } = useAdminRequest();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as "student" | "admin")}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          disabled={pending}
        >
          <option value="student">student</option>
          <option value="admin">admin</option>
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run({
              url: `/api/admin/users/${userId}`,
              method: "PATCH",
              body: { role },
              successMessage: "Role updated."
            })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Update role"}
        </button>
      </div>
      {dialog}
    </div>
  );
}

export function AdminDangerButton({
  label,
  url,
  method = "DELETE",
  confirmMessage,
  confirmTitle,
  confirmLabel,
  successMessage
}: {
  label: string;
  url: string;
  method?: "POST" | "DELETE";
  confirmMessage: string;
  confirmTitle?: string;
  confirmLabel?: string;
  successMessage?: string;
}) {
  const { pending, run, dialog } = useAdminRequest();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run({
            url,
            method,
            confirmMessage,
            confirmTitle,
            confirmLabel,
            successMessage
          })
        }
        className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        <span>{pending ? "Working..." : label}</span>
      </button>
      {dialog}
    </div>
  );
}

export function AdminRuntimeControlsForm({
  initialSignupsEnabled,
  initialLinkingEnabled
}: {
  initialSignupsEnabled: boolean;
  initialLinkingEnabled: boolean;
}) {
  const [signupsEnabled, setSignupsEnabled] = useState(initialSignupsEnabled);
  const [linkingEnabled, setLinkingEnabled] = useState(initialLinkingEnabled);
  const { pending, run, dialog } = useAdminRequest();

  async function saveControls(next: {
    signupsEnabled?: boolean;
    linkingEnabled?: boolean;
  }) {
    const success = await run({
      url: "/api/admin/runtime-controls",
      method: "PATCH",
      body: next,
      successMessage: "Controls updated."
    });

    if (!success) {
      setSignupsEnabled(initialSignupsEnabled);
      setLinkingEnabled(initialLinkingEnabled);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[1.2rem] border border-line bg-surface px-4 py-4">
          <div className="text-sm font-semibold text-ink">New signups</div>
          <p className="mt-1 text-xs leading-6 text-slate">
            Stops brand-new student accounts from registering. Existing accounts can still sign in.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || signupsEnabled}
              onClick={() => {
                setSignupsEnabled(true);
                void saveControls({ signupsEnabled: true });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-success px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Enable
            </button>
            <button
              type="button"
              disabled={pending || !signupsEnabled}
              onClick={() => {
                setSignupsEnabled(false);
                void saveControls({ signupsEnabled: false });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger disabled:opacity-60"
            >
              Disable
            </button>
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-line bg-surface px-4 py-4">
          <div className="text-sm font-semibold text-ink">Automatic data linking</div>
          <p className="mt-1 text-xs leading-6 text-slate">
            When disabled, DOB and roll submissions stay pending until admin approval. Re-enabling will auto-link matching pending requests.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || linkingEnabled}
              onClick={() => {
                setLinkingEnabled(true);
                void saveControls({ linkingEnabled: true });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-success px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Enable
            </button>
            <button
              type="button"
              disabled={pending || !linkingEnabled}
              onClick={() => {
                setLinkingEnabled(false);
                void saveControls({ linkingEnabled: false });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger disabled:opacity-60"
            >
              Disable
            </button>
          </div>
        </div>
      </div>
      {dialog}
    </div>
  );
}

export function AdminUserDashboardAccessForm({
  userId,
  initialEnabled
}: {
  userId: number;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const { pending, run, dialog } = useAdminRequest();

  async function setDashboardAccess(nextEnabled: boolean) {
    setEnabled(nextEnabled);
    const success = await run({
      url: `/api/admin/users/${userId}`,
      method: "PATCH",
      body: { dashboardAccessEnabled: nextEnabled },
      successMessage: nextEnabled ? "Dashboard access enabled." : "Dashboard access disabled."
    });

    if (!success) {
      setEnabled(initialEnabled);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending || enabled}
          onClick={() => void setDashboardAccess(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-success px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Enable dashboard
        </button>
        <button
          type="button"
          disabled={pending || !enabled}
          onClick={() => void setDashboardAccess(false)}
          className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger disabled:opacity-60"
        >
          Disable dashboard
        </button>
      </div>
      {dialog}
    </div>
  );
}

export function AdminCreateAdminForm({
  actorType,
  actorBranchName,
  availableBranches
}: {
  actorType: "main_admin" | "hod";
  actorBranchName: string | null;
  availableBranches: string[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staffType, setStaffType] = useState<"hod" | "teacher" | "placement_cell">(
    actorType === "hod" ? "teacher" : "teacher"
  );
  const [branchName, setBranchName] = useState(actorType === "hod" ? actorBranchName ?? "" : "");
  const { pending, run, dialog } = useAdminRequest();
  const branchLocked = actorType === "hod";

  async function handleCreate() {
    const success = await run({
      url: "/api/admin/admins",
      method: "POST",
      body: {
        name,
        email,
        password,
        staffType,
        branchName: branchLocked ? actorBranchName : branchName
      },
      successMessage: "Staff account created."
    });

    if (success) {
      setName("");
      setEmail("");
      setPassword("");
      setStaffType(actorType === "hod" ? "teacher" : "teacher");
      setBranchName(actorType === "hod" ? actorBranchName ?? "" : "");
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="Staff name"
          disabled={pending}
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="staff@glbitm.ac.in"
          disabled={pending}
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="Temporary password"
          disabled={pending}
        />
        <select
          value={staffType}
          onChange={(event) => {
            const nextType = event.target.value as "hod" | "teacher" | "placement_cell";
            setStaffType(nextType);
            if (nextType === "placement_cell" && !branchLocked) {
              setBranchName("");
            }
          }}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          disabled={pending || actorType === "hod"}
        >
          {actorType === "main_admin" ? <option value="hod">HOD</option> : null}
          <option value="teacher">Teacher</option>
          {actorType === "main_admin" ? <option value="placement_cell">Placement cell</option> : null}
        </select>
        <select
          value={branchLocked ? actorBranchName ?? "" : branchName}
          onChange={(event) => setBranchName(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          disabled={pending || branchLocked || staffType === "placement_cell"}
        >
          <option value="">{staffType === "placement_cell" ? "No branch scope" : "Select branch"}</option>
          {availableBranches.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={handleCreate}
        className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        <span>{pending ? "Creating..." : actorType === "hod" ? "Create teacher" : "Create staff account"}</span>
      </button>
      {dialog}
    </div>
  );
}

export function AdminStaffProfileForm({
  userId,
  initialStaffType,
  initialBranchName,
  initialStatus,
  availableBranches
}: {
  userId: number;
  initialStaffType: "hod" | "teacher" | "placement_cell";
  initialBranchName: string | null;
  initialStatus: "active" | "suspended";
  availableBranches: string[];
}) {
  const [staffType, setStaffType] = useState(initialStaffType);
  const [branchName, setBranchName] = useState(initialBranchName ?? "");
  const [status, setStatus] = useState(initialStatus);
  const { pending, run, dialog } = useAdminRequest();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <select
          value={staffType}
          onChange={(event) => {
            const nextType = event.target.value as "hod" | "teacher" | "placement_cell";
            setStaffType(nextType);
            if (nextType === "placement_cell") {
              setBranchName("");
            }
          }}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          disabled={pending}
        >
          <option value="hod">HOD</option>
          <option value="teacher">Teacher</option>
          <option value="placement_cell">Placement cell</option>
        </select>
        <select
          value={branchName}
          onChange={(event) => setBranchName(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          disabled={pending || staffType === "placement_cell"}
        >
          <option value="">{staffType === "placement_cell" ? "No branch scope" : "Select branch"}</option>
          {availableBranches.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "active" | "suspended")}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          disabled={pending}
        >
          <option value="active">active</option>
          <option value="suspended">suspended</option>
        </select>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run({
            url: `/api/admin/admins/${userId}`,
            method: "PATCH",
            body: { staffType, branchName, status },
            successMessage: "Staff profile updated."
          })
        }
        className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        <span>{pending ? "Saving..." : "Save staff access"}</span>
      </button>
      {dialog}
    </div>
  );
}

export function AdminLinkForm({
  linkId,
  initialRollNo,
  initialDob,
  initialStatus
}: {
  linkId: number;
  initialRollNo: string;
  initialDob: string;
  initialStatus: string;
}) {
  const [rollNo, setRollNo] = useState(initialRollNo);
  const [dob, setDob] = useState(initialDob);
  const [status, setStatus] = useState(initialStatus);
  const { pending, run, dialog } = useAdminRequest();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <input
          value={rollNo}
          onChange={(event) => setRollNo(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="Roll no"
          disabled={pending}
        />
        <input
          value={dob}
          onChange={(event) => setDob(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="DOB"
          disabled={pending}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          disabled={pending}
        >
          <option value="linked">linked</option>
          <option value="pending_data">pending_data</option>
          <option value="rejected">rejected</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run({
              url: `/api/admin/links/${linkId}`,
              method: "PATCH",
              body: { rollNo, dob, status },
              successMessage: "Link updated."
            })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          <span>{pending ? "Saving..." : "Save link"}</span>
        </button>
        <AdminDangerButton
          label="Delete link"
          url={`/api/admin/links/${linkId}`}
          confirmMessage="Delete this student link?"
          confirmTitle="Delete link"
          successMessage="Link deleted."
        />
      </div>
      {dialog}
    </div>
  );
}

export function AdminDataRequestForm({
  requestId,
  initialRollNo,
  initialDob,
  initialStatus,
  initialNotes
}: {
  requestId: number;
  initialRollNo: string;
  initialDob: string;
  initialStatus: string;
  initialNotes: string | null;
}) {
  const [rollNo, setRollNo] = useState(initialRollNo);
  const [dob, setDob] = useState(initialDob);
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const { pending, run, dialog } = useAdminRequest();

  async function submit(action: "save" | "approve" | "reject") {
    await run({
      url: `/api/admin/data-requests/${requestId}`,
      method: "PATCH",
      body: { rollNo, dob, status, notes, action },
      confirmMessage: action === "approve" ? "Approve this request and link the student record?" : undefined,
      confirmTitle: action === "approve" ? "Approve request" : undefined,
      confirmLabel: action === "approve" ? "Approve and link" : undefined,
      successMessage:
        action === "approve" ? "Request approved and linked." : action === "reject" ? "Request rejected." : "Request saved."
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <input
          value={rollNo}
          onChange={(event) => setRollNo(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="Roll no"
          disabled={pending}
        />
        <input
          value={dob}
          onChange={(event) => setDob(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="DOB"
          disabled={pending}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          disabled={pending}
        >
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>
      </div>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="min-h-20 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
        placeholder="Notes"
        disabled={pending}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("save")}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          <span>{pending ? "Saving..." : "Save request"}</span>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("approve")}
          className="inline-flex items-center gap-2 rounded-xl bg-success px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          <span>Approve & link</span>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("reject")}
          className="inline-flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-sm font-semibold text-warning disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          <span>Reject</span>
        </button>
        <AdminDangerButton
          label="Delete request"
          url={`/api/admin/data-requests/${requestId}`}
          confirmMessage="Delete this data request?"
          confirmTitle="Delete request"
          successMessage="Data request deleted."
        />
      </div>
      {dialog}
    </div>
  );
}

export function AdminStudentAttachForm({ studentId }: { studentId: number }) {
  const [appUserId, setAppUserId] = useState("");
  const [dob, setDob] = useState("");
  const { pending, run, dialog } = useAdminRequest();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input
          value={appUserId}
          onChange={(event) => setAppUserId(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="App user ID"
          disabled={pending}
        />
        <input
          value={dob}
          onChange={(event) => setDob(event.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="DOB to store"
          disabled={pending}
        />
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run({
            url: `/api/admin/students/${studentId}/link`,
            method: "POST",
            body: { appUserId: Number(appUserId), dob },
            confirmMessage: "Attach this student to the specified app user?",
            confirmTitle: "Attach student",
            confirmLabel: "Attach",
            successMessage: "Student attached."
          })
        }
        className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        <span>{pending ? "Linking..." : "Attach to app user"}</span>
      </button>
      {dialog}
    </div>
  );
}

export function RankingRebuildButton() {
  const { pending, run, dialog } = useAdminRequest();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run({
            url: "/api/admin/maintenance/rebuild-rankings",
            method: "POST",
            confirmMessage: "Rebuild the entire student ranking cache?",
            confirmTitle: "Rebuild ranking cache",
            confirmLabel: "Rebuild",
            successMessage: "Ranking cache rebuilt."
          })
        }
        className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        <span>{pending ? "Rebuilding..." : "Rebuild ranking cache"}</span>
      </button>
      {dialog}
    </div>
  );
}

export function DashboardCacheRebuildButton() {
  const { pending, run, dialog } = useAdminRequest();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run({
            url: "/api/admin/maintenance/dashboard-cache/rebuild",
            method: "POST",
            confirmMessage: "Rebuild full app snapshot rows for all currently linked students?",
            confirmTitle: "Rebuild app snapshot cache",
            confirmLabel: "Rebuild",
            successMessage: "App snapshot cache rebuilt."
          })
        }
        className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        <span>{pending ? "Rebuilding..." : "Rebuild app snapshot cache"}</span>
      </button>
      {dialog}
    </div>
  );
}

export function DashboardCacheClearButton() {
  const { pending, run, dialog } = useAdminRequest();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run({
            url: "/api/admin/maintenance/dashboard-cache/clear",
            method: "POST",
            confirmMessage: "Clear all stored app snapshot cache rows?",
            confirmTitle: "Clear app snapshot cache",
            confirmLabel: "Clear cache",
            successMessage: "App snapshot cache cleared."
          })
        }
        className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        <span>{pending ? "Clearing..." : "Clear app snapshot cache"}</span>
      </button>
      {dialog}
    </div>
  );
}
export function AuthCleanupButton() {
  const { pending, run, dialog } = useAdminRequest();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run({
            url: "/api/admin/maintenance/auth-cleanup",
            method: "POST",
            confirmMessage: "Permanently delete ALL users who signed up over 48 hours ago but haven't verified their email?",
            confirmTitle: "Purge unverified accounts",
            confirmLabel: "Purge accounts",
            successMessage: "Purge complete."
          })
        }
        className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        <span>{pending ? "Purging..." : "Purge unverified accounts (48h+)"}</span>
      </button>
      {dialog}
    </div>
  );
}
