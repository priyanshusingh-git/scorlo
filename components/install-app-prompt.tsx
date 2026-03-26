"use client";

import { Download, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISS_KEY = "scorlo_install_prompt_dismissed_at";
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function isAppleMobile() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function hasRecentDismissal() {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;

  const timestamp = Number(raw);
  return Number.isFinite(timestamp) && Date.now() - timestamp < DISMISS_WINDOW_MS;
}

function markDismissed() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

export function InstallAppPrompt({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [installing, setInstalling] = useState(false);

  const eligibleForPrompt = useMemo(() => {
    return isMobileDevice() && !isStandaloneMode() && !hasRecentDismissal();
  }, []);

  useEffect(() => {
    if (!eligibleForPrompt) return;

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowIosHint(false);
      setVisible(true);
    }

    function handleAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
      setShowIosHint(false);
    }

    const timer = window.setTimeout(() => {
      if (isAppleMobile()) {
        setShowIosHint(true);
        setVisible(true);
      }
    }, 1400);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [eligibleForPrompt]);

  async function handleInstall() {
    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      }
      if (choice.outcome === "dismissed") {
        markDismissed();
        setVisible(false);
      }
      setDeferredPrompt(null);
    } finally {
      setInstalling(false);
    }
  }

  function handleDismiss() {
    markDismissed();
    setVisible(false);
  }

  if (!visible || !eligibleForPrompt) {
    return null;
  }

  return (
    <div
      className={cn(
        "glass-card fixed inset-x-4 bottom-24 z-40 rounded-[1.5rem] border border-white/70 px-4 py-3 shadow-[0_26px_80px_-42px_rgba(16,32,49,0.55)] lg:hidden",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
          {showIosHint && !deferredPrompt ? (
            <Share2 className="h-4.5 w-4.5" strokeWidth={2.1} />
          ) : (
            <Download className="h-4.5 w-4.5" strokeWidth={2.1} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink">Install Scorlo</div>
          <p className="mt-1 text-[12px] leading-5 text-mist">
            {showIosHint && !deferredPrompt
              ? 'Use Share and choose "Add to Home Screen".'
              : "Add Scorlo to your home screen for faster access."}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-[12px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.1} />
                {installing ? "Opening..." : "Install"}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-2 text-[12px] font-medium text-mist">
                <Share2 className="h-3.5 w-3.5" strokeWidth={2.1} />
                Add to Home Screen
              </div>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center rounded-full px-3 py-2 text-[12px] font-medium text-mist transition hover:bg-white/40"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss install prompt"
          onClick={handleDismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mist transition hover:bg-white/40"
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
