import { AdminDesktopNav } from "@/components/admin-nav";
import { AdminBottomNav } from "@/components/admin-bottom-nav";
import { InstallAppPrompt } from "@/components/install-app-prompt";
import { LogoutButton } from "@/components/logout-button";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { isMainAdminUser } from "@/lib/auth/admin";
import { getCurrentSessionUser } from "@/lib/auth/session";

export async function AdminShell({
  children
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
}) {
  const admin = await getCurrentSessionUser();
  const isMainAdmin = admin?.role === "admin" && isMainAdminUser(admin);

  return (
    <div className="page-shell min-h-screen w-full px-4 pb-28 pt-20 sm:px-6 sm:pt-20 lg:px-8 lg:pb-10 lg:pt-8 2xl:px-10">
      <MobileTopBar
        label={
          <div className="flex items-center gap-2">
            <span className="font-display text-[1.7rem] leading-none tracking-[-0.06em] text-ink">Scorlo</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded">Admin</span>
          </div>
        }
      />
      <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-6 lg:grid-cols-[296px_minmax(0,1fr)] xl:grid-cols-[312px_minmax(0,1fr)]">
        <aside className="ink-panel sticky top-8 hidden h-[calc(100vh-4rem)] overflow-hidden text-white lg:flex lg:flex-col lg:rounded-[2.3rem] lg:p-7 lg:shadow-[0_30px_80px_-42px_rgba(6,16,26,0.9)]">
          <div className="absolute -right-12 top-4 h-44 w-44 rounded-full bg-warning/18 blur-3xl" />
          <div className="absolute -left-10 bottom-10 h-40 w-40 rounded-full bg-accent/22 blur-3xl" />
          <div className="flex h-full flex-col">
            <div className="flex flex-col gap-1">
              <span className="font-display text-[2.15rem] leading-none tracking-[-0.08em] text-white">
                Scorlo
              </span>
            </div>
            <div className="mt-8 flex-1">
              <AdminDesktopNav isMainAdmin={isMainAdmin} />
            </div>
            <LogoutButton className="mt-5 inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12 disabled:opacity-60" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <main className="flex-1 space-y-5 lg:space-y-6">{children}</main>
        </div>
      </div>
      <InstallAppPrompt />
      <AdminBottomNav isMainAdmin={isMainAdmin} />
    </div>
  );
}
