"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SPLASH_KEY = "scorlo-mobile-splash-seen";

export function MobileAppSplash() {
  const [phase, setPhase] = useState<"visible" | "closing" | "hidden">("visible");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isDesktop || isStandalone) {
      setPhase("hidden");
      return;
    }

    const alreadySeen = window.sessionStorage.getItem(SPLASH_KEY) === "1";
    if (alreadySeen) {
      setPhase("hidden");
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const visibleDuration = prefersReducedMotion ? 320 : 950;
    const closeDuration = 260;

    const closeTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(SPLASH_KEY, "1");
      setPhase("closing");
    }, visibleDuration);

    const hideTimer = window.setTimeout(() => {
      setPhase("hidden");
    }, visibleDuration + closeDuration);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#f6f2ea] lg:hidden",
        "transition-all duration-300 ease-out",
        phase === "closing" ? "pointer-events-none opacity-0 scale-[1.02]" : "opacity-100"
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(246,242,234,0.94)_38%,rgba(239,231,216,0.96)_100%)]" />
      <div
        className="absolute left-[-18%] top-[-8%] h-[58%] w-[72%] rounded-full opacity-75"
        style={{
          background: "radial-gradient(circle, rgba(216,154,39,0.2) 0%, transparent 72%)",
          filter: "blur(90px)"
        }}
      />
      <div
        className="absolute bottom-[-12%] right-[-10%] h-[54%] w-[70%] rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(28,63,151,0.17) 0%, transparent 72%)",
          filter: "blur(110px)"
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.22] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")'
        }}
      />

      <div className="relative z-10 flex w-full max-w-[22rem] flex-col items-center px-6">
        <Image
          src="/brand/scorlo-premium-mark-transparent.png"
          alt="Scorlo"
          width={1083}
          height={888}
          priority
          className="h-auto w-full max-w-[14rem] object-contain mix-blend-multiply"
        />
        <div className="mt-8 flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d89a27] [animation-delay:-0.24s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1c3f97] [animation-delay:-0.12s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d89a27]" />
        </div>
      </div>
    </div>
  );
}
