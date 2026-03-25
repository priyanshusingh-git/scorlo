import { AppShell } from "@/components/app-shell";

function SkeletonBlock({
  className
}: {
  className: string;
}) {
  return <div aria-hidden="true" className={`animate-pulse rounded-[1.2rem] bg-line/60 ${className}`} />;
}

export function StudentPageSkeleton({
  title,
  eyebrow,
  variant = "dashboard"
}: {
  title: string;
  eyebrow: string;
  variant?: "dashboard" | "results" | "profile" | "rankings";
}) {
  return (
    <AppShell eyebrow={eyebrow} title={title}>
      <div aria-busy="true" aria-live="polite" className="space-y-5 lg:space-y-6">
        {variant === "dashboard" ? (
          <>
            <section className="rounded-[1.8rem] border border-line bg-surface px-5 py-6 shadow-soft">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="mt-4 h-12 w-2/3 max-w-xl" />
              <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="h-20 w-full" />
              </div>
            </section>
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
              <div className="rounded-[1.8rem] border border-line bg-surface px-5 py-6 shadow-soft">
                <SkeletonBlock className="h-5 w-36" />
                <SkeletonBlock className="mt-3 h-4 w-72" />
                <SkeletonBlock className="mt-6 h-56 w-full" />
              </div>
              <div className="rounded-[1.8rem] border border-line bg-surface px-5 py-6 shadow-soft">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="mt-3 h-4 w-64" />
                <div className="mt-6 space-y-3">
                  <SkeletonBlock className="h-10 w-full" />
                  <SkeletonBlock className="h-10 w-full" />
                  <SkeletonBlock className="h-24 w-full" />
                </div>
              </div>
            </section>
          </>
        ) : null}

        {variant === "results" ? (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)]">
            <div className="rounded-[1.8rem] border border-line bg-surface px-5 py-6 shadow-soft">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="mt-3 h-4 w-72" />
              <div className="mt-6 space-y-3">
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-24 w-full" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-[1.8rem] border border-line bg-surface px-5 py-6 shadow-soft">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="mt-3 h-4 w-80" />
              </div>
              <SkeletonBlock className="h-40 w-full rounded-[1.8rem]" />
              <SkeletonBlock className="h-40 w-full rounded-[1.8rem]" />
              <SkeletonBlock className="h-40 w-full rounded-[1.8rem]" />
            </div>
          </section>
        ) : null}

        {variant === "profile" ? (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
            <div className="rounded-[1.8rem] border border-line bg-surface px-5 py-6 shadow-soft">
              <SkeletonBlock className="h-8 w-56" />
              <SkeletonBlock className="mt-3 h-4 w-64" />
              <div className="mt-6 space-y-3">
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="h-20 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SkeletonBlock className="h-64 w-full rounded-[1.8rem]" />
              <SkeletonBlock className="h-40 w-full rounded-[1.8rem]" />
              <SkeletonBlock className="h-40 w-full rounded-[1.8rem] lg:col-span-2" />
            </div>
          </section>
        ) : null}

        {variant === "rankings" ? (
          <>
            <section className="rounded-[1.8rem] border border-line bg-surface px-5 py-6 shadow-soft">
              <div className="flex flex-wrap gap-3">
                <SkeletonBlock className="h-10 w-32" />
                <SkeletonBlock className="h-10 w-32" />
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <SkeletonBlock className="h-28 w-full" />
                <SkeletonBlock className="h-28 w-full" />
                <SkeletonBlock className="h-28 w-full" />
              </div>
            </section>
            <section className="rounded-[1.8rem] border border-line bg-surface px-5 py-6 shadow-soft">
              <SkeletonBlock className="h-5 w-44" />
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-24 w-full" />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
