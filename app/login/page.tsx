import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { LoginBackground } from "@/components/login-background";
import { getCurrentSessionUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const user = await getCurrentSessionUser();

  if (user?.role === "admin") {
    redirect("/admin");
  }

  if (user) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-app px-4 sm:px-6">
      <LoginBackground />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Branding that pops in Ink */}
        <div className="mb-10 flex flex-col items-center text-center">
          <h1 className="font-display text-[4.2rem] italic leading-none tracking-[-0.04em] text-ink sm:text-[5.5rem] pr-[0.1em]">
            Scorlo
          </h1>
          <div className="mt-3 h-px w-12 bg-gradient-to-r from-transparent via-border-strong/20 to-transparent" />
        </div>

        {/* Focused Login Container (Ivory/White) */}
        <div className="relative rounded-shell border border-line bg-surface p-8 shadow-scorlo sm:p-10">
          <SignInForm />
        </div>
      </div>
    </main>
  );
}
