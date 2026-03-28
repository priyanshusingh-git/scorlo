"use client";

import { useEffect } from "react";

export function ClearStaleSession() {
  useEffect(() => {
    void fetch("/api/auth/session", {
      method: "DELETE",
      cache: "no-store",
      keepalive: true
    }).catch(() => {
      // Best-effort cleanup for invalid or stale session cookies.
    });
  }, []);

  return null;
}
