"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export function LogoutButton({
  className = ""
}: {
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      try {
        await getFirebaseClientAuth().signOut();
      } catch {
        // Server cookie removal is the critical part.
      }
      router.push("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={className}
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.1} />
      ) : (
        <LogOut className="h-4 w-4" strokeWidth={2.1} />
      )}
      <span>{pending ? "Logging out..." : "Logout"}</span>
    </button>
  );
}
