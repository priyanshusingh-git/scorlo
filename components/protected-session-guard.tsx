"use client";

import { useLayoutEffect } from "react";

export function ProtectedSessionGuard() {
  useLayoutEffect(() => {
    let inFlight = false;

    async function verifySession() {
      if (inFlight) return;
      inFlight = true;

      try {
        const response = await fetch("/api/me", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin"
        });

        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        try {
          sessionStorage.removeItem("scorlo:logged_out");
        } catch {
          // Ignore storage failures.
        }
        document.documentElement.removeAttribute("data-protected-pending");
      } catch {
        if (hasLogoutMarker) {
          window.location.replace("/login");
          return;
        }
        document.documentElement.removeAttribute("data-protected-pending");
      } finally {
        inFlight = false;
      }
    }

    const hasLogoutMarker = (() => {
      try {
        return sessionStorage.getItem("scorlo:logged_out") === "1";
      } catch {
        return false;
      }
    })();

    if (hasLogoutMarker) {
      document.documentElement.setAttribute("data-protected-pending", "1");
      void verifySession();
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        document.documentElement.setAttribute("data-protected-pending", "1");
      }
      void verifySession();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        document.documentElement.setAttribute("data-protected-pending", "1");
        void verifySession();
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
