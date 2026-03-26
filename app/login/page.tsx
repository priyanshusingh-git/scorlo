import Image from "next/image";
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
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-app px-4 py-8 sm:px-6 sm:py-12">
      <LoginBackground />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center">
        <div className="mb-4 flex w-[210px] justify-center sm:mb-5 sm:w-[236px]">
          <Image
            src="/brand/scorlo-premium-mark-transparent.png"
            alt="Scorlo"
            width={1083}
            height={888}
            className="mx-auto h-auto w-full object-contain"
            priority
          />
        </div>

        <div className="relative w-full rounded-shell border border-line bg-surface p-7 shadow-scorlo sm:p-8">
          <SignInForm />
        </div>
      </div>
    </main>
  );
}
