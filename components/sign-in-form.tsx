"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { AlertCircle, CheckCircle2, ChevronRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
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

function getModeFromHash(hash: string): "login" | "register" | "reset" | "verify" {
  switch (hash.replace(/^#/, "").toLowerCase()) {
    case "register":
      return "register";
    case "reset":
      return "reset";
    case "verify":
      return "verify";
    default:
      return "login";
  }
}

function getHashForMode(mode: "login" | "register" | "reset" | "verify") {
  return mode === "login" ? "" : `#${mode}`;
}

export function SignInForm({
  signupsEnabled,
  initialNotice = null
}: {
  signupsEnabled: boolean;
  initialNotice?: { tone: "error" | "success" | "info"; message: string } | null;
}) {
  const [mode, setMode] = useState<"login" | "register" | "reset" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreedToTerms?: string;
  }>({});
  const [status, setStatus] = useState<{ tone: "error" | "success" | "info"; message: string } | null>(initialNotice);
  const [activeAction, setActiveAction] = useState<"submit" | "resend" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [redirectingTo, setRedirectingTo] = useState<"student" | "admin" | null>(null);

  const submitting = activeAction === "submit";
  const resending = activeAction === "resend";

  useEffect(() => {
    // Initialize Firebase client immediately on mount
    const auth = getFirebaseClientAuth();
    void setPersistence(auth, inMemoryPersistence).catch(() => {
      // Keep the login form usable even if persistence setup fails.
    });

    const initialMode = getModeFromHash(window.location.hash);
    if (initialMode === "register" && !signupsEnabled) {
      setMode("login");
      setStatus({ tone: "info", message: "New signups are currently disabled by the admin." });
      window.history.replaceState({ authMode: "login" }, "", `${window.location.pathname}${window.location.search}`);
    } else if (initialMode !== "login") {
      setMode(initialMode);
    }

    function handleHashChange() {
      const nextMode = getModeFromHash(window.location.hash);
      if (nextMode === "register" && !signupsEnabled) {
        setMode("login");
        setStatus({ tone: "info", message: "New signups are currently disabled by the admin." });
        window.history.replaceState({ authMode: "login" }, "", `${window.location.pathname}${window.location.search}`);
        return;
      }

      setMode(nextMode);
      setStatus(null);
      setFieldErrors({});
      setPassword("");
      setConfirmPassword("");
      setAgreedToTerms(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setRedirectingTo(null);
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;

      setMode(getModeFromHash(window.location.hash));
      setStatus(null);
      setFieldErrors({});
      setPassword("");
      setConfirmPassword("");
      setAgreedToTerms(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [signupsEnabled]);

  function switchMode(nextMode: "login" | "register" | "reset" | "verify") {
    if (nextMode === "register" && !signupsEnabled) {
      setMode("login");
      setStatus({ tone: "info", message: "New signups are currently disabled by the admin." });
      return;
    }

    setMode(nextMode);
    setStatus(null);
    setFieldErrors({});
    setPassword("");
    setConfirmPassword("");
    setAgreedToTerms(false);
    setShowPassword(false);
    setShowConfirmPassword(false);

    const nextHash = getHashForMode(nextMode);
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.pushState({ authMode: nextMode }, "", nextUrl);
  }

  function clearFieldError(field: "email" | "password" | "confirmPassword" | "agreedToTerms") {
    setFieldErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleResend() {
    setStatus(null);
    setFieldErrors({});

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !isAllowedDomain(normalizedEmail)) {
      setStatus({
        tone: "error",
        message: "Use an allowed institutional email address before requesting another verification link."
      });
      return;
    }

    setActiveAction("resend");
    try {
      const auth = getFirebaseClientAuth();
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setStatus({ tone: "success", message: "A fresh verification link has been sent to your email." });
      } else {
        setStatus({ tone: "error", message: "Unable to resend. Please sign in again." });
      }
    } catch (error) {
      setStatus({ tone: "error", message: getAuthErrorMessage(error) });
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setFieldErrors({});

    const normalizedEmail = email.trim();
    const nextErrors: { email?: string; password?: string; confirmPassword?: string; agreedToTerms?: string } = {};

    if (!normalizedEmail) {
      nextErrors.email = "Enter your email address.";
    }

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (mode === "register" && normalizedEmail && !isAllowedDomain(normalizedEmail)) {
      nextErrors.email = "This email address is not permitted for registration.";
    }

    if (mode === "register" && !signupsEnabled) {
      setStatus({ tone: "info", message: "New signups are currently disabled by the admin." });
      setActiveAction(null);
      return;
    }

    if (mode !== "reset" && mode !== "verify") {
      if (!password) {
        nextErrors.password = "Enter your password.";
      } else if (mode === "register" && password.length < 6) {
        nextErrors.password = "Password must be at least 6 characters.";
      }
    }

    if (mode === "register") {
      if (!confirmPassword) {
        nextErrors.confirmPassword = "Confirm your password.";
      } else if (password && confirmPassword !== password) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }

      if (!agreedToTerms) {
        nextErrors.agreedToTerms = "You must agree to the Terms of Service and Privacy Policy.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setActiveAction("submit");

    try {
      const auth = getFirebaseClientAuth();
      await setPersistence(auth, inMemoryPersistence);

      if (mode === "reset") {
        await sendPasswordResetEmail(auth, normalizedEmail);
        setStatus({
          tone: "success",
          message: "If an account exists for this email, a password reset link has been sent."
        });
        return;
      }

      const credential =
        mode === "login"
          ? await signInWithEmailAndPassword(auth, normalizedEmail, password)
          : await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      if (mode === "register" && !credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        switchMode("verify");
        setStatus({ tone: "info", message: "Account created! Verify your email to continue." });
        return;
      }

      await credential.user.reload();

      if (!credential.user.emailVerified) {
        switchMode("verify");
        setStatus({ tone: "info", message: "Your email is not verified yet." });
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
          setStatus({ tone: "info", message: "Verify your email address before signing in." });
          return;
        }

        await signOut(auth).catch(() => {});
        throw new Error(payload?.message ?? "Unable to create a secure session.");
      }

      const destination = payload?.redirectTo === "/admin" ? "/admin" : "/";
      setRedirectingTo(destination === "/admin" ? "admin" : "student");
      await signOut(auth).catch(() => {});
      try {
        sessionStorage.removeItem("scorlo:logged_out");
        document.documentElement.removeAttribute("data-protected-pending");
      } catch {
        // Ignore storage cleanup failures before redirect.
      }
      window.setTimeout(() => {
        window.location.replace(destination);
      }, 40);
      return;
    } catch (error) {
      const msg = getAuthErrorMessage(error);
      if (msg === "Email or password is incorrect." && mode !== "reset") {
        setFieldErrors({
          password: "Email or password is incorrect."
        });
        setStatus(null);
        return;
      }

      if (msg === "Enter your email address first." || msg === "Enter a valid email address.") {
        setFieldErrors({
          email: msg === "Enter your email address first." ? "Enter your email address." : msg
        });
        setStatus(null);
        return;
      }
      setStatus({ tone: "error", message: msg });
      if (msg.toLowerCase().includes("verify")) {
        switchMode("verify");
      }
    } finally {
      setActiveAction(null);
    }
  }
  const titles = {
    login: { h2: "Log in", subtitle: "Continue to your Scorlo workspace." },
    register: { h2: "Create account", subtitle: "Use your institutional email to get started." },
    reset: { h2: "Reset password", subtitle: "We’ll send a secure reset link to your email." },
    verify: { h2: "Verify email", subtitle: "Activate your account before your first sign in." }
  };

  const isRegister = mode === "register";
  const isReset = mode === "reset";
  const isVerify = mode === "verify";

  function renderFieldError(message?: string) {
    if (!message) return null;

    return (
      <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-danger">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{message}</span>
      </p>
    );
  }

  if (redirectingTo) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-ink">
            Opening {redirectingTo === "admin" ? "admin workspace" : "student workspace"}
          </h2>
          <p className="text-sm leading-relaxed text-slate">
            Your session is ready. Taking you to the next screen now.
          </p>
        </div>

        <div className="rounded-inner border border-line bg-surface-muted p-4">
          <div className="flex items-center gap-3">
            <LoaderCircle className="h-4 w-4 animate-spin text-accent" />
            <span className="text-sm font-medium text-ink">Preparing your dashboard...</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-12 animate-pulse rounded-inner bg-line/50" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 animate-pulse rounded-inner bg-line/50" />
              <div className="h-20 animate-pulse rounded-inner bg-line/50" />
            </div>
            <div className="h-28 animate-pulse rounded-inner bg-line/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-[-0.02em] text-ink">
          {titles[mode].h2}
        </h2>
        <p className="text-sm leading-relaxed text-slate">{titles[mode].subtitle}</p>
      </div>

      {isVerify ? (
        <div className="rounded-inner border border-line bg-surface-muted p-5 text-[13px] leading-relaxed text-slate">
          <p className="font-medium text-ink">Action Required: Verify your email</p>
          <p className="mt-1">
            {status?.message || "A verification link has been sent. You will not be able to log in until your account is verified."}
          </p>
          <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-mist/60">
            Check your spam folder too.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-mist">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearFieldError("email");
              }}
              placeholder="you@glbitm.ac.in"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={fieldErrors.email ? "true" : "false"}
              className="w-full rounded-inner border border-line bg-white px-5 py-4 text-sm text-ink outline-none transition-all placeholder:text-mist focus:border-accent/40"
              required
            />
            {renderFieldError(fieldErrors.email)}
          </div>

          {!isReset ? (
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="login-password" className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-mist">
                  Password
                </label>
                {mode === "login" ? (
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    disabled={submitting || resending}
                    className="text-[11px] font-semibold text-accent transition-colors hover:text-accent-strong"
                  >
                    Forgot password?
                  </button>
                ) : null}
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFieldError("password");
                  }}
                  placeholder={isRegister ? "Create a password" : "Enter your password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  aria-invalid={fieldErrors.password ? "true" : "false"}
                  className="w-full rounded-inner border border-line bg-white px-5 py-4 pr-14 text-sm text-ink outline-none transition-all placeholder:text-mist focus:border-accent/40"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-mist transition-colors hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {renderFieldError(fieldErrors.password)}
            </div>
          ) : null}

          {isRegister ? (
            <>
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-mist">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearFieldError("confirmPassword");
                    }}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    aria-invalid={fieldErrors.confirmPassword ? "true" : "false"}
                    className="w-full rounded-inner border border-line bg-white px-5 py-4 pr-14 text-sm text-ink outline-none transition-all placeholder:text-mist focus:border-accent/40"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-mist transition-colors hover:text-ink"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {renderFieldError(fieldErrors.confirmPassword)}
              </div>

              <div className="mt-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(event) => {
                      setAgreedToTerms(event.target.checked);
                      clearFieldError("agreedToTerms");
                    }}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-line text-accent focus:ring-accent"
                  />
                  <span className="text-[13px] leading-relaxed text-slate">
                    I agree to Scorlo&apos;s{" "}
                    <Link href="/terms" target="_blank" className="font-semibold text-accent underline hover:text-accent-strong">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" target="_blank" className="font-semibold text-accent underline hover:text-accent-strong">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                {renderFieldError(fieldErrors.agreedToTerms)}
              </div>
            </>
          ) : null}
        </div>
      )}

      {status && !isVerify ? (
        <div
          className={`rounded-inner border px-4 py-3 text-[13px] leading-relaxed ${
            status.tone === "error"
              ? "border-danger/20 bg-danger/5 text-danger"
              : status.tone === "success"
                ? "border-success/20 bg-success/5 text-success"
                : "border-accent/20 bg-accent/5 text-accent-strong"
          }`}
        >
          <div className="flex items-start gap-2">
            {status.tone === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{status.message}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {isVerify ? (
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
                    ? "Creating account..."
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
                    ? "Create account"
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
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist">
              New user?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                disabled={submitting || resending || !signupsEnabled}
                className="text-accent underline underline-offset-4 hover:text-accent-strong transition-colors"
              >
                {signupsEnabled ? "Sign up" : "Signups closed"}
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

        <div className="flex gap-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-mist/60 mt-1">
          <Link href="/terms" target="_blank" className="hover:text-ink transition-colors">
            Terms
          </Link>
          <span>•</span>
          <Link href="/privacy" target="_blank" className="hover:text-ink transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </form>
  );
}
