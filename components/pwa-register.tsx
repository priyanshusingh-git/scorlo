"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    async function syncServiceWorker() {
      if (process.env.NODE_ENV === "development") {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        return;
      }

      await navigator.serviceWorker.register(SW_URL, {
        scope: "/",
        updateViaCache: "none"
      });
    }

    syncServiceWorker().catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[pwa] register_failed", error);
      }
    });
  }, []);

  return null;
}
