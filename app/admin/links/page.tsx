import { Suspense } from "react";
import { AdminDataRequestForm, AdminLinkForm } from "@/components/admin-actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminSectionFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { requireAdminSession } from "@/lib/auth/admin";
import { searchAdminDataRequests, searchAdminLinks } from "@/lib/queries/admin";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLinksPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const linkStatus = typeof params.linkStatus === "string" ? params.linkStatus : "";
  const requestStatus = typeof params.requestStatus === "string" ? params.requestStatus : "";

  const moderationPromise = Promise.all([
    searchAdminLinks({ query, status: linkStatus }),
    searchAdminDataRequests({ query, status: requestStatus })
  ]);

  return (
    <AdminShell eyebrow="Moderation" title="Links And Requests">
      <SectionBlock
        title="Search and filter"
        description="Manage linked accounts and pending verification records in one place."
      >
        <form className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by roll number, student name, or email"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          />
          <select
            name="linkStatus"
            defaultValue={linkStatus}
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          >
            <option value="">All link statuses</option>
            <option value="linked">linked</option>
            <option value="pending_data">pending_data</option>
            <option value="rejected">rejected</option>
          </select>
          <select
            name="requestStatus"
            defaultValue={requestStatus}
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          >
            <option value="">All request statuses</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
          <button className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">Apply</button>
        </form>
      </SectionBlock>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Suspense
          fallback={
            <AdminSectionFallback
              title="Student links"
              description="Direct account-to-student mappings."
              rows={3}
            />
          }
        >
          <LinksSection moderationPromise={moderationPromise} />
        </Suspense>

        <Suspense
          fallback={
            <AdminSectionFallback
              title="Data requests"
              description="Pending or historical request rows that can be edited, approved, rejected, or deleted."
              rows={3}
            />
          }
        >
          <RequestsSection moderationPromise={moderationPromise} />
        </Suspense>
      </section>
    </AdminShell>
  );
}

async function LinksSection({
  moderationPromise
}: {
  moderationPromise: Promise<
    [Awaited<ReturnType<typeof searchAdminLinks>>, Awaited<ReturnType<typeof searchAdminDataRequests>>]
  >;
}) {
  const [links] = await moderationPromise;

  return (
    <SectionBlock title="Student links" description="Direct account-to-student mappings.">
      <div className="space-y-4">
        {links.map((link) => (
          <div key={link.id} className="rounded-[1.2rem] border border-line bg-surface px-4 py-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge tone={link.status === "linked" ? "success" : "warning"}>{link.status}</StatusBadge>
              <StatusBadge tone={link.role === "admin" ? "warning" : "info"}>{link.role}</StatusBadge>
              <StatusBadge tone="accent">User #{link.app_user_id}</StatusBadge>
            </div>
            <div className="mb-3 text-sm leading-7 text-slate">
              <div className="font-semibold text-ink">{link.email}</div>
              <div>{link.student_name ?? "No student attached"} • Roll {link.roll_no}</div>
              <div>DOB {link.dob}</div>
            </div>
            <AdminLinkForm
              linkId={link.id}
              initialRollNo={link.roll_no}
              initialDob={link.dob}
              initialStatus={link.status}
            />
          </div>
        ))}
        {links.length === 0 ? <p className="text-sm text-slate">No student links matched the filters.</p> : null}
      </div>
    </SectionBlock>
  );
}

async function RequestsSection({
  moderationPromise
}: {
  moderationPromise: Promise<
    [Awaited<ReturnType<typeof searchAdminLinks>>, Awaited<ReturnType<typeof searchAdminDataRequests>>]
  >;
}) {
  const [, requests] = await moderationPromise;

  return (
    <SectionBlock
      title="Data requests"
      description="Pending or historical request rows that can be edited, approved, rejected, or deleted."
    >
      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="rounded-[1.2rem] border border-line bg-surface px-4 py-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge tone={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : "warning"}>
                {request.status}
              </StatusBadge>
              <StatusBadge tone="accent">User #{request.app_user_id}</StatusBadge>
            </div>
            <div className="mb-3 text-sm leading-7 text-slate">
              <div className="font-semibold text-ink">{request.email}</div>
              <div>Roll {request.roll_no}</div>
              <div>DOB {request.dob}</div>
            </div>
            <AdminDataRequestForm
              requestId={request.id}
              initialRollNo={request.roll_no}
              initialDob={request.dob}
              initialStatus={request.status}
              initialNotes={request.notes}
            />
          </div>
        ))}
        {requests.length === 0 ? <p className="text-sm text-slate">No data requests matched the filters.</p> : null}
      </div>
    </SectionBlock>
  );
}
