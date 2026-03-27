import { Suspense } from "react";
import { AdminCreateAdminForm, AdminDangerButton } from "@/components/admin-actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminSectionFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { requireMainAdminSession } from "@/lib/auth/admin";
import { searchAdminAccounts } from "@/lib/queries/admin";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAccountsPage({ searchParams }: PageProps) {
  const admin = await requireMainAdminSession();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const adminsPromise = searchAdminAccounts({ query });

  return (
    <AdminShell eyebrow="Admin accounts" title="Manage Admins">
      <SectionBlock title="Create admin">
        <AdminCreateAdminForm />
      </SectionBlock>

      <SectionBlock title="Admin profiles">
        <form className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by name or email"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          />
          <button className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">Search</button>
        </form>
      </SectionBlock>

      <Suspense
        fallback={
          <AdminSectionFallback
            title="Admin profiles"
            description=""
            rows={3}
          />
        }
      >
        <AdminAccountsList adminsPromise={adminsPromise} currentAdminId={admin.id} />
      </Suspense>
    </AdminShell>
  );
}

async function AdminAccountsList({
  adminsPromise,
  currentAdminId
}: {
  adminsPromise: ReturnType<typeof searchAdminAccounts>;
  currentAdminId: number;
}) {
  const admins = await adminsPromise;

  return (
    <div className="space-y-4">
      {admins.map((account) => (
        <SectionBlock
          key={account.id}
          title={account.display_name ?? "Admin"}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge tone="warning">{account.is_main_admin ? "Main admin" : "Admin"}</StatusBadge>
            <StatusBadge tone={account.email_verified ? "success" : "danger"}>
              {account.email_verified ? "Email verified" : "Unverified"}
            </StatusBadge>
            {account.id === currentAdminId ? <StatusBadge tone="info">Current session</StatusBadge> : null}
          </div>
          <div className="space-y-4">
            <div className="text-sm text-slate">{account.email}</div>
            {!account.is_main_admin ? (
              <AdminDangerButton
                label="Delete admin account"
                url={`/api/admin/users/${account.id}`}
                confirmMessage={`Delete admin account ${account.display_name ?? account.email}?`}
                successMessage="Admin account deleted."
              />
            ) : null}
          </div>
        </SectionBlock>
      ))}

      {admins.length === 0 ? (
        <SectionBlock title="No admin accounts found">
          <p className="text-sm text-slate">No admin accounts matched the search.</p>
        </SectionBlock>
      ) : null}
    </div>
  );
}
