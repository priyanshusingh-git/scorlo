import { Suspense } from "react";
import { AdminDangerButton } from "@/components/admin-actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminSectionFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { requireAdminSession } from "@/lib/auth/admin";
import { searchAdminAccounts } from "@/lib/queries/admin";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAccountsPage({ searchParams }: PageProps) {
  const admin = await requireAdminSession();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const adminsPromise = searchAdminAccounts({ query });

  return (
    <AdminShell eyebrow="Admin accounts" title="Manage Admins">
      <SectionBlock
        title="Admin profiles"
        description="Admin accounts are provisioned separately from student users and cannot be converted from student profiles."
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by admin email or display name"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          />
          <button className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">Search</button>
        </form>
      </SectionBlock>

      <Suspense
        fallback={
          <AdminSectionFallback
            title="Admin profiles"
            description="Admin accounts are provisioned separately from student users and cannot be converted from student profiles."
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
          title={account.email}
          description={`Admin #${account.id} • ${account.display_name ?? "No display name"}`}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge tone="warning">admin</StatusBadge>
            <StatusBadge tone={account.email_verified ? "success" : "danger"}>
              {account.email_verified ? "Email verified" : "Unverified"}
            </StatusBadge>
            {account.id === currentAdminId ? <StatusBadge tone="info">Current session</StatusBadge> : null}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
            <div className="space-y-3 text-sm text-slate">
              <InfoLine label="Created" value={account.created_at} />
              <InfoLine label="Updated" value={account.updated_at} />
              <InfoLine label="Last login" value={account.last_login_at ?? "Never"} />
              <InfoLine label="Profile type" value="Admin-only account" />
            </div>
            <div className="space-y-4">
              <div className="rounded-[1rem] bg-app/70 px-4 py-4 text-sm leading-7 text-slate">
                This account is managed separately from student profiles. It has no AKTU roll-number or DOB workflow.
              </div>
              <AdminDangerButton
                label="Delete admin account"
                url={`/api/admin/users/${account.id}`}
                confirmMessage={`Delete admin account ${account.email}? The last remaining admin and your current session are protected.`}
                successMessage="Admin account deleted."
              />
            </div>
          </div>
        </SectionBlock>
      ))}

      {admins.length === 0 ? (
        <SectionBlock title="No admin accounts found" description="Adjust the search term and try again.">
          <p className="text-sm text-slate">No admin accounts matched the search.</p>
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
