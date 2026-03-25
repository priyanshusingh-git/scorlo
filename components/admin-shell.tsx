import { BellDot } from "lucide-react";
import { AdminDesktopNav } from "@/components/admin-nav";
import { AdminBottomNav } from "@/components/admin-bottom-nav";
import { LogoutButton } from "@/components/logout-button";
import { StatusBadge } from "@/components/status-badge";

export function AdminShell({
  children,
  title,
  eyebrow
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
}) {
  return (
    <div className="page-shell min-h-screen w-full px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8 2xl:px-10">
      <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="ink-panel hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:rounded-[2rem] lg:p-7 lg:shadow-scorlo">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/55">{eyebrow}</div>
            <div className="mt-3 font-display text-[2.5rem] leading-none tracking-[-0.06em] text-white">
              Scorlo Admin
            </div>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Internal controls for accounts, links, student records, and ranking maintenance.
            </p>
            <div className="mt-6">
              <AdminDesktopNav />
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
            <StatusBadge tone="accent" className="bg-white/12 text-white">
              Admin mode
            </StatusBadge>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Use destructive actions carefully. Every admin mutation is written to the audit log.
            </p>
            <LogoutButton className="mt-5 inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12 disabled:opacity-60" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="shell-panel mb-6 flex items-start justify-between gap-4 rounded-[1.8rem] border border-line/70 px-5 py-4 shadow-soft lg:mb-8 lg:px-7 lg:py-6">
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-mist">{eyebrow}</div>
              <h1 className="font-display text-[2.1rem] leading-none tracking-[-0.05em] text-ink sm:text-[2.6rem]">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="rounded-2xl border border-line bg-surface/80 p-3 text-slate shadow-soft backdrop-blur"
              >
                <BellDot className="h-5 w-5" strokeWidth={2.1} />
              </button>
              <LogoutButton className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface/80 px-3 py-3 text-sm font-semibold text-ink shadow-soft backdrop-blur disabled:opacity-60 lg:px-4" />
            </div>
          </header>
          <main className="flex-1 space-y-5 lg:space-y-6">{children}</main>
        </div>
      </div>
      <AdminBottomNav />
    </div>
  );
}
