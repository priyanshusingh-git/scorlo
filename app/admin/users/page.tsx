import { Suspense } from "react";
import { AdminDangerButton } from "@/components/admin-actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminSectionFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { requireAdminSession } from "@/lib/auth/admin";
import { searchAdminUsers } from "@/lib/queries/admin";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const usersPromise = searchAdminUsers({ query, role: "student" });

  return (
    <AdminShell eyebrow="Student user management" title="Student Users">
      <SectionBlock
        title="Search and filter"
        description="Inspect student app accounts, linked roll numbers, stored DOB values, and latest request state."
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by email, display name, roll number, or student name"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          />
          <button className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">Apply</button>
        </form>
      </SectionBlock>

      <Suspense
        fallback={
          <AdminSectionFallback
            title="Student users"
            description="Inspect student app accounts, linked roll numbers, stored DOB values, and latest request state."
            rows={4}
          />
        }
      >
        <StudentUsersList usersPromise={usersPromise} />
      </Suspense>
    </AdminShell>
  );
}

async function StudentUsersList({
  usersPromise
}: {
  usersPromise: ReturnType<typeof searchAdminUsers>;
}) {
  const users = await usersPromise;

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <SectionBlock
          key={user.id}
          title={user.email}
          description={`User #${user.id} • ${user.display_name ?? "No display name"}`}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge tone="info">student</StatusBadge>
            <StatusBadge tone={user.email_verified ? "success" : "danger"}>
              {user.email_verified ? "Email verified" : "Unverified"}
            </StatusBadge>
            <StatusBadge tone={user.link_status === "linked" ? "success" : "warning"}>
              {user.link_status ?? "No link"}
            </StatusBadge>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)]">
            <div className="space-y-3 text-sm text-slate">
              <InfoLine label="Created" value={user.created_at} />
              <InfoLine label="Updated" value={user.updated_at} />
              <InfoLine label="Last login" value={user.last_login_at ?? "Never"} />
              <InfoLine label="Linked roll" value={user.link_roll_no ?? "Not linked"} />
              <InfoLine label="Stored DOB" value={user.link_dob ?? user.latest_request_dob ?? "Not stored"} />
              <InfoLine label="Student" value={user.student_name ?? "Not linked"} />
              <InfoLine label="Latest request" value={user.latest_request_status ?? "No request"} />
              {user.latest_request_notes ? <InfoLine label="Request notes" value={user.latest_request_notes} /> : null}
            </div>
            <div className="space-y-4">
              <div className="rounded-[1rem] bg-app/70 px-4 py-4 text-sm leading-7 text-slate">
                Student users stay student-only. Admin accounts are managed separately in the
                dedicated admin section and cannot be converted from student profiles.
              </div>
              <AdminDangerButton
                label="Delete user"
                url={`/api/admin/users/${user.id}`}
                confirmMessage={`Delete user ${user.email}? This will cascade linked app-owned rows.`}
                successMessage="User deleted."
              />
            </div>
          </div>
        </SectionBlock>
      ))}

      {users.length === 0 ? (
        <SectionBlock title="No users found" description="Adjust the search term or role filter and try again.">
          <p className="text-sm text-slate">No matching app users were found.</p>
        </SectionBlock>
      ) : null}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-app/70 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-mist">{label}</div>
      <div className="mt-1 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
