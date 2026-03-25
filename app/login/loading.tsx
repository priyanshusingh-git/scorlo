import { LoginBackground } from "@/components/login-background";

export default function Loading() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-app px-4 sm:px-6">
      <LoginBackground />

      <div className="relative z-10 w-full max-w-[420px] animate-pulse">
        {/* Branding Skeleton */}
        <div className="mb-10 flex flex-col items-center">
          <div className="h-20 w-48 rounded-2xl bg-border-subtle/40" />
          <div className="mt-4 h-px w-16 bg-border-strong opacity-20" />
        </div>

        {/* Card Skeleton */}
        <div className="relative rounded-shell border border-line bg-surface p-8 shadow-scorlo sm:p-10">
          <div className="mb-8">
            <div className="h-7 w-24 rounded-lg bg-border-subtle/40" />
            <div className="mt-2 h-4 w-48 rounded-full bg-border-subtle/30" />
          </div>

          <div className="space-y-4">
            <div className="h-14 w-full rounded-inner bg-surface-muted/60" />
            <div className="h-14 w-full rounded-inner bg-surface-muted/60" />
            <div className="mt-6 h-14 w-full rounded-inner bg-border-subtle/40" />
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 pt-8">
            <div className="h-3 w-32 rounded-full bg-border-subtle/20" />
            <div className="h-3 w-48 rounded-full bg-border-subtle/20" />
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="mt-12 flex justify-center">
          <div className="h-3 w-56 rounded-full bg-border-subtle/20" />
        </div>
      </div>
    </main>
  );
}
