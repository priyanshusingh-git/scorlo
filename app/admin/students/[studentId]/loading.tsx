import { SectionBlock } from "@/components/section-block";

function SkeletonLine({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-line/60 ${className}`} />;
}

export default function AdminStudentProfileLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-route-content-in space-y-5 lg:space-y-6">
      <SectionBlock title="Opening student profile">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <SkeletonLine className="h-7 w-24 rounded-full" />
            <SkeletonLine className="h-7 w-28 rounded-full" />
            <SkeletonLine className="h-7 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="rounded-[1rem] border border-line bg-surface px-4 py-3">
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="mt-3 h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </SectionBlock>

      <SectionBlock title="Rankings">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="rounded-[1.1rem] border border-line bg-surface px-4 py-4">
              <SkeletonLine className="h-4 w-28" />
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <SkeletonLine className="h-16 w-full rounded-[1rem]" />
                <SkeletonLine className="h-16 w-full rounded-[1rem]" />
              </div>
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Semesters">
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-[1.1rem] border border-line bg-surface px-4 py-4">
              <SkeletonLine className="h-4 w-32" />
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <SkeletonLine className="h-16 w-full rounded-[1rem]" />
                <SkeletonLine className="h-16 w-full rounded-[1rem]" />
                <SkeletonLine className="h-16 w-full rounded-[1rem]" />
              </div>
            </div>
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}
