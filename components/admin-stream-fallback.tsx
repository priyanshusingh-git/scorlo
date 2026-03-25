import { SectionBlock } from "@/components/section-block";

function SkeletonLine({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-line/60 ${className}`} />;
}

export function AdminSectionFallback({
  title,
  description,
  rows = 3
}: {
  title: string;
  description: string;
  rows?: number;
}) {
  return (
    <SectionBlock title={title} description={description}>
      <div aria-busy="true" className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="rounded-[1.2rem] border border-line bg-surface px-4 py-4"
          >
            <SkeletonLine className="h-4 w-32" />
            <SkeletonLine className="mt-3 h-4 w-4/5" />
            <SkeletonLine className="mt-2 h-4 w-3/5" />
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}

export function AdminStatsFallback() {
  return (
    <section aria-busy="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          className="rounded-[1.35rem] border border-line bg-surface px-4 py-4 shadow-soft"
        >
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="mt-3 h-8 w-16" />
        </div>
      ))}
    </section>
  );
}
