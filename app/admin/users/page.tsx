import { Suspense } from "react";
import { AdminDangerButton, AdminDataRequestForm, AdminLinkForm } from "@/components/admin-actions";
import { AdminSectionFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { requireMainAdminSession } from "@/lib/auth/admin";
import { searchAdminUsers } from "@/lib/queries/admin";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireMainAdminSession();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const usersPromise = searchAdminUsers({ query, role: "student" });

  return (
    <>
      <SectionBlock title="Search">
        <form className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by email, roll number, or student name"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          />
          <button className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">Apply</button>
        </form>
      </SectionBlock>

      <Suspense fallback={<AdminSectionFallback title="Updated users" description="" rows={4} />}>
        <UpdatedUsersList usersPromise={usersPromise} />
      </Suspense>
    </>
  );
}

async function UpdatedUsersList({
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
          title={user.student_name ?? user.display_name ?? user.email}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge tone={user.email_verified ? "success" : "danger"}>
              {user.email_verified ? "Verified" : "Unverified"}
            </StatusBadge>
            <StatusBadge tone={user.link_status === "linked" ? "success" : user.link_status === "rejected" ? "danger" : "warning"}>
              {user.link_status ?? "No link"}
            </StatusBadge>
            {user.link_roll_no ? <StatusBadge tone="info">{user.link_roll_no}</StatusBadge> : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1rem] bg-app/70 px-4 py-3 text-sm text-slate">
              <div className="font-medium text-ink">{user.email}</div>
              <div className="mt-1">
                {user.student_name ?? "No linked student"}
              </div>
            </div>

            {user.student_link_id ? (
              <AdminLinkForm
                linkId={user.student_link_id}
                initialRollNo={user.link_roll_no ?? ""}
                initialDob={user.link_dob ?? ""}
                initialStatus={user.link_status ?? "pending_data"}
              />
            ) : null}

            {user.latest_request_id ? (
              <AdminDataRequestForm
                requestId={user.latest_request_id}
                initialRollNo={user.latest_request_roll_no ?? user.link_roll_no ?? ""}
                initialDob={user.latest_request_dob ?? user.link_dob ?? ""}
                initialStatus={user.latest_request_status ?? "pending"}
                initialNotes={user.latest_request_notes}
              />
            ) : null}

            <AdminDangerButton
              label="Delete user"
              url={`/api/admin/users/${user.id}`}
              confirmMessage={`Delete user ${user.email}? This will cascade linked app-owned rows.`}
              successMessage="User deleted."
            />
          </div>
        </SectionBlock>
      ))}

      {users.length === 0 ? (
        <SectionBlock title="No users found">
          <p className="text-sm text-slate">No matching student accounts were found.</p>
        </SectionBlock>
      ) : null}
    </div>
  );
}
