function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-[1.2rem] bg-line/60 ${className}`} />;
}

export function AdminPageSkeleton({
  variant = "overview"
}: {
  variant?: "overview" | "list" | "students" | "maintenance";
}) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-5 lg:space-y-6">
      {variant === "overview" ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-24 w-full" />
          </section>
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
            <SkeletonBlock className="h-80 w-full rounded-[1.8rem]" />
            <SkeletonBlock className="h-80 w-full rounded-[1.8rem]" />
          </section>
          <SkeletonBlock className="h-72 w-full rounded-[1.8rem]" />
        </>
      ) : null}

      {variant === "list" ? (
        <>
          <section className="rounded-[1.8rem] border border-line bg-surface px-5 py-6 shadow-soft">
            <SkeletonBlock className="h-5 w-44" />
            <SkeletonBlock className="mt-3 h-4 w-80" />
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-28" />
            </div>
          </section>
          <SkeletonBlock className="h-56 w-full rounded-[1.8rem]" />
          <SkeletonBlock className="h-56 w-full rounded-[1.8rem]" />
          <SkeletonBlock className="h-56 w-full rounded-[1.8rem]" />
        </>
      ) : null}

      {variant === "students" ? (
        <>
          <section className="rounded-[1.8rem] border border-line bg-surface px-5 py-6 shadow-soft">
            <SkeletonBlock className="h-12 w-full" />
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          </section>
          <SkeletonBlock className="h-[36rem] w-full rounded-[1.8rem]" />
        </>
      ) : null}

      {variant === "maintenance" ? (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)]">
          <div className="space-y-5">
            <SkeletonBlock className="h-64 w-full rounded-[1.8rem]" />
            <SkeletonBlock className="h-64 w-full rounded-[1.8rem]" />
          </div>
          <div className="space-y-5">
            <SkeletonBlock className="h-72 w-full rounded-[1.8rem]" />
            <SkeletonBlock className="h-72 w-full rounded-[1.8rem]" />
          </div>
        </section>
      ) : null}
    </div>
  );
}
