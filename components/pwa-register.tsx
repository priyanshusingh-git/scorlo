"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    async function removeCachingLayer() {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
    }

    removeCachingLayer().catch(() => {
      // The app should still work even if local cache cleanup fails.
    });
  }, []);

  return null;
}
