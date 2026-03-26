import Image from "next/image";
import { LoginBackground } from "@/components/login-background";

export default function Loading() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-app px-4 py-8 sm:px-6 sm:py-12">
      <LoginBackground />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center animate-pulse">
        <div className="mb-4 flex w-[210px] justify-center sm:mb-5 sm:w-[236px]">
          <Image
            src="/brand/scorlo-premium-mark-transparent.png"
            alt="Scorlo"
            width={1083}
            height={888}
            className="mx-auto h-auto w-full object-contain opacity-80"
            priority
          />
        </div>

        <div className="relative w-full rounded-shell border border-line bg-surface p-7 shadow-scorlo sm:p-8">
          <div className="mb-6">
            <div className="h-7 w-24 rounded-lg bg-border-subtle/40" />
          </div>

          <div className="space-y-4">
            <div className="h-14 w-full rounded-inner bg-surface-muted/60" />
            <div className="h-14 w-full rounded-inner bg-surface-muted/60" />
            <div className="mt-6 h-14 w-full rounded-inner bg-border-subtle/40" />
          </div>

          <div className="mt-6 flex flex-col items-center gap-4 pt-6">
            <div className="h-3 w-32 rounded-full bg-border-subtle/20" />
            <div className="h-3 w-48 rounded-full bg-border-subtle/20" />
          </div>
        </div>
      </div>
    </main>
  );
}
