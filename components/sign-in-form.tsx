"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { ChevronRight, LoaderCircle } from "lucide-react";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

function isAllowedDomain(email: string) {
  const normalized = email.toLowerCase().trim();
  // Allow @glbitm.ac.in and @scorlo.in for Admins
  return normalized.endsWith("@glbitm.ac.in") || normalized.endsWith("@scorlo.in");
}

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
    case "auth/missing-email":
      return "Enter your email address first.";
    default:
      break;
  }

  return error instanceof Error ? error.message : "Unable to authenticate.";
}

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "reset" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<"submit" | "resend" | null>(null);

  const submitting = activeAction === "submit";
  const resending = activeAction === "resend";

  useEffect(() => {
    // Initialize Firebase client immediately on mount
    getFirebaseClientAuth();
  }, []);

  function switchMode(nextMode: "login" | "register" | "reset" | "verify") {
    setMode(nextMode);
    setStatus(null);
    if (nextMode !== "login" && nextMode !== "verify") {
      setPassword("");
    }
  }

  async function handleResend() {
    setStatus(null);
    setActiveAction("resend");
    try {
      const auth = getFirebaseClientAuth();
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setStatus("A fresh verification link has been sent to your email.");
      } else {
        setStatus("Unable to resend: Please try signing in again.");
      }
    } catch (error) {
      setStatus(getAuthErrorMessage(error));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setStatus("Enter your email address first.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setStatus("Enter a valid email address.");
      return;
    }

    if (mode === "register" && !isAllowedDomain(normalizedEmail)) {
      setStatus("This email address is not permitted for registration.");
      return;
    }

    setActiveAction("submit");

    try {
      const auth = getFirebaseClientAuth();
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, normalizedEmail);
        setStatus("Password reset email sent. Check your inbox and spam folder.");
        return;
      }

      const credential =
        mode === "login"
          ? await signInWithEmailAndPassword(auth, normalizedEmail, password)
          : await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      if (mode === "register" && !credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        await signOut(auth);
        switchMode("verify");
        setStatus("Account created! Verify your email to continue.");
        return;
      }

      await credential.user.reload();

      if (!credential.user.emailVerified) {
        // Still signed in but unverified
        switchMode("verify");
        setStatus("Your email is not verified yet.");
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
          switchMode("verify");
          setStatus("Verify your email address before signing in.");
          return;
        }

        throw new Error(payload?.message ?? "Unable to create a secure session.");
      }

      router.push(payload?.redirectTo === "/admin" ? "/admin" : "/");
      router.refresh();
    } catch (error) {
      const msg = getAuthErrorMessage(error);
      setStatus(msg);
      if (msg.toLowerCase().includes("verify")) {
        switchMode("verify");
      }
    } finally {
      setActiveAction(null);
    }
  }
  const titles = {
    login: { h2: "Log in" },
    register: { h2: "Create Account" },
    reset: { h2: "Reset Password" },
    verify: { h2: "Verify Email" }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold tracking-[-0.02em] text-ink">
          {titles[mode].h2}
        </h2>
      </div>

      {mode !== "verify" ? (
        <div className="space-y-4">
          <div className="relative group">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              className="w-full rounded-inner border border-line bg-white shadow-sm px-5 py-4 text-sm text-ink outline-none transition-all placeholder:text-mist focus:border-accent/40 group-hover:border-line-strong"
              required
            />
          </div>

          {mode !== "reset" ? (
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-inner border border-line bg-white shadow-sm px-5 py-4 text-sm text-ink outline-none transition-all placeholder:text-mist focus:border-accent/40 group-hover:border-line-strong"
                minLength={6}
                required
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "verify" ? (
        <div className="rounded-inner border border-line bg-surface-muted p-5 text-[13px] leading-relaxed text-slate">
          <p className="font-medium text-ink">Action Required: Verify your email</p>
          <p className="mt-1">
            {status || "A verification link has been sent. You will not be able to log in until your account is verified."}
          </p>
          <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-mist/60">
            Check your spam folder too.
          </div>
        </div>
      ) : null}

      {mode === "reset" ? (
        <div className="rounded-inner border border-line bg-surface-muted p-4 text-[13px] leading-relaxed text-slate">
          <p>Enter your email and we'll send you a password reset link.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {mode === "verify" ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-inner bg-ink px-5 py-4 text-sm font-bold text-white transition-all hover:bg-ink/90 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
          >
            {resending ? (
              <div className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin text-white/60" />
                <span className="text-[13px] tracking-tight">Resending Link...</span>
              </div>
            ) : (
              <span className="flex items-center gap-2">
                Resend Verification Link
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-inner bg-ink px-5 py-4 text-sm font-bold text-white transition-all hover:bg-ink/90 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting ? (
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.3s]" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.15s]" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" />
                </div>
                <span className="text-[13px] tracking-tight">
                  {mode === "register" 
                    ? "Creating Account..." 
                    : mode === "reset" 
                      ? "Sending link..." 
                      : "Authenticating..."}
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-2">
                {mode === "login"
                  ? "Sign in"
                  : mode === "register"
                    ? "Create Account"
                    : "Reset Password"}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </button>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 border-t border-line pt-8">
        {mode === "login" ? (
          <>
            <button
              type="button"
              onClick={() => switchMode("reset")}
              disabled={submitting || resending}
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist hover:text-ink transition-colors"
            >
              Forgot password?
            </button>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              New user?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                disabled={submitting || resending}
                className="text-accent underline underline-offset-4 hover:text-accent-strong transition-colors"
              >
                Sign up
              </button>
            </p>
          </>
        ) : mode === "verify" ? (
          <button
            type="button"
            onClick={() => switchMode("login")}
            disabled={submitting || resending}
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist hover:text-ink transition-colors"
          >
            ← Back to sign in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode("login")}
            disabled={submitting || resending}
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist hover:text-ink transition-colors"
          >
            ← Back to sign in
          </button>
        )}
      </div>

  {status && mode !== "verify" ? (
    <div className="mt-6 rounded-inner border border-line bg-surface-muted px-5 py-4 text-[13px] leading-relaxed text-ink animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col gap-1">
        <p>{status}</p>
        {(status.toLowerCase().includes("sent") || 
          status.toLowerCase().includes("created") || 
          status.toLowerCase().includes("verification") || 
          status.toLowerCase().includes("link")) && (
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.05em] text-mist">
            Please check your spam folder too.
          </p>
        )}
      </div>
    </div>
  ) : null}
    </form>
  );
}
