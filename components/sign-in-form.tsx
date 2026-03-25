"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { ChevronRight } from "lucide-react";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import { StatusBadge } from "@/components/status-badge";

function getAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : null;

  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Switch to Login and sign in.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error while contacting Firebase. Check your connection and try again.";
    default:
      break;
  }

  return error instanceof Error ? error.message : "Unable to authenticate.";
}

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);

    try {
      const auth = getFirebaseClientAuth();
      const credential =
        mode === "login"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);

      if (mode === "register" && !credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        await signOut(auth);
        setMode("login");
        setPassword("");
        setStatus("Account created. A verification email has been sent. Verify your email, then sign in.");
        return;
      }

      await credential.user.reload();

      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        await signOut(auth);
        setPassword("");
        setStatus("Your email is not verified yet. A fresh verification email has been sent. Verify it, then sign in.");
        return;
      }

      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string; redirectTo?: string }
        | null;

      if (!response.ok) {
        if (payload?.error === "email_not_verified") {
          throw new Error("Verify your email address before signing in.");
        }

        throw new Error(payload?.message ?? "Unable to create a secure session.");
      }

      router.push(payload?.redirectTo === "/admin" ? "/admin" : "/");
      router.refresh();
    } catch (error) {
      setStatus(getAuthErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            mode === "login" ? "bg-ink text-white" : "bg-surface-muted text-mist"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            mode === "register" ? "bg-ink text-white" : "bg-surface-muted text-mist"
          }`}
        >
          Register
        </button>
      </div>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Student email address"
        className="w-full rounded-[1.2rem] border border-line bg-surface-muted/70 px-4 py-4 text-sm text-ink outline-none ring-0 placeholder:text-mist"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        className="w-full rounded-[1.2rem] border border-line bg-surface-muted/70 px-4 py-4 text-sm text-ink outline-none ring-0 placeholder:text-mist"
        minLength={6}
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-accent-strong px-4 py-4 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
      >
        {pending ? "Working..." : mode === "login" ? "Continue to Scorlo" : "Create account"}
        <ChevronRight className="h-4 w-4" />
      </button>
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="info">Verification email</StatusBadge>
        <StatusBadge tone="accent">Session cookie</StatusBadge>
      </div>
      {status ? <p className="text-sm leading-6 text-slate">{status}</p> : null}
    </form>
  );
}
