import { SignInForm } from "@/components/sign-in-form";
import { StatusBadge } from "@/components/status-badge";

export default function LoginPage() {
  return (
    <main className="page-shell min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 2xl:px-10">
      <div className="grid min-h-[calc(100vh-3rem)] grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.82fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(460px,0.78fr)]">
        <section className="ink-panel relative flex flex-col justify-between overflow-hidden rounded-[2rem] p-5 shadow-scorlo sm:p-7 lg:p-8 xl:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.12),transparent_22%),radial-gradient(circle_at_78%_72%,rgba(15,139,141,0.18),transparent_25%)]" />
          <div>
            <div className="relative mb-8 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/55">Scorlo auth</div>
                <h1 className="mt-2 font-display text-[2.4rem] leading-none tracking-[-0.05em] text-white sm:text-[3.4rem]">
                  Welcome back
                </h1>
              </div>
              <StatusBadge tone="accent" className="bg-white/12 text-white">Firebase</StatusBadge>
            </div>

            <section className="relative rounded-[1.9rem] border border-white/10 bg-white/8 p-5 backdrop-blur sm:p-6">
              <h2 className="max-w-xl text-[1.7rem] font-bold tracking-[-0.04em] text-white sm:text-[2.35rem] sm:leading-[1.05]">
                Track every semester with clarity.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/74 sm:text-[15px]">
                Mobile-first academic records, progress charts, batch rankings, and backlog history
                in one polished student app.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge tone="success" className="bg-white/12 text-white">Email verified flow</StatusBadge>
                <StatusBadge tone="accent" className="bg-white/12 text-white">Installable PWA</StatusBadge>
              </div>
            </section>

            <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Charts</div>
                <div className="mt-2 text-sm font-semibold text-white">Semester arc</div>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Ranks</div>
                <div className="mt-2 text-sm font-semibold text-white">Batch + branch</div>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">History</div>
                <div className="mt-2 text-sm font-semibold text-white">Backlog recovery</div>
              </div>
            </div>
          </div>

          <p className="relative px-2 pt-8 text-left text-xs leading-6 text-white/54 lg:max-w-sm">
            Built as a premium utility layer on top of AKTU academic data, not a generic admin
            panel.
          </p>
        </section>

        <section className="flex items-center">
          <div className="surface-panel w-full rounded-[2rem] border border-line p-5 shadow-soft sm:p-7">
            <h2 className="text-lg font-bold tracking-[-0.03em] text-ink sm:text-xl">Sign in</h2>
            <p className="mt-1 text-sm leading-6 text-slate">
              Firebase now handles email/password auth and the server exchanges the ID token for a secure session cookie.
            </p>
            <SignInForm />
            <div className="surface-subtle mt-6 rounded-[1.2rem] border border-line px-4 py-4 text-sm leading-7 text-slate">
              Link your AKTU roll number after login and Scorlo will attach the existing Neon-backed academic record or create a pending data request.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
