"use client";

import { useEffect, useState } from "react";

let currentVisible = true;
let lastScrollY = 0;
let ticking = false;
let listening = false;
const listeners = new Set<(visible: boolean) => void>();

function emit(nextVisible: boolean) {
  if (currentVisible === nextVisible) return;
  currentVisible = nextVisible;
  for (const listener of listeners) {
    listener(nextVisible);
  }
}

function evaluateScrollPosition() {
  const currentScroll = window.scrollY;
  const delta = currentScroll - lastScrollY;

  if (currentScroll <= 16) {
    emit(true);
  } else if (delta > 12) {
    emit(false);
  } else if (delta < -10) {
    emit(true);
  }

  lastScrollY = currentScroll;
  ticking = false;
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(evaluateScrollPosition);
}

function ensureListener() {
  if (listening || typeof window === "undefined") return;
  lastScrollY = window.scrollY;
  window.addEventListener("scroll", onScroll, { passive: true });
  listening = true;
}

function cleanupListenerIfIdle() {
  if (!listening || typeof window === "undefined" || listeners.size > 0) return;
  window.removeEventListener("scroll", onScroll);
  listening = false;
  ticking = false;
}

export function useMobileChromeVisibility() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setVisible(currentVisible);
    listeners.add(setVisible);
    ensureListener();

    return () => {
      listeners.delete(setVisible);
      cleanupListenerIfIdle();
    };
  }, []);

  return visible;
}
