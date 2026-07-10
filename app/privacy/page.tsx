import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen w-full bg-app px-4 py-8 sm:px-6 sm:py-16 md:py-24">
      <div className="mx-auto max-w-[720px] rounded-shell border border-line bg-surface p-6 shadow-scorlo sm:p-10 md:p-12">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-mist transition hover:text-ink mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>

        <header className="mb-10 border-b border-line pb-8">
          <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate">
            Last updated: July 11, 2026
          </p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed text-slate">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              1. Introduction
            </h2>
            <p>
              Welcome to <strong>Scorlo</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). Scorlo is a mobile-first academic companion portal designed for students of Dr. A.P.J. Abdul Kalam Technical University (AKTU). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and safeguard your personal information when you use our platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              2. Information We Collect
            </h2>
            <p>
              To provide you with academic tracking and rankings, we collect and store the following types of information:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> When you sign up, we collect your email address and password credentials. These are securely processed and authenticated using Firebase Authentication.
              </li>
              <li>
                <strong>Academic Verification:</strong> When you link your student profile, we require your university <strong>Roll Number</strong> and <strong>Date of Birth (DOB)</strong>.
              </li>
              <li>
                <strong>Academic Records:</strong> Once verified, we cache and store your academic snapshots, including grades, subjects, semester SGPA, and cumulative CGPA.
              </li>
              <li>
                <strong>Support Requests:</strong> If you submit a support ticket to correct errors or update records, we collect the details of your request along with any supporting explanations.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              3. How We Use Your Data
            </h2>
            <p>
              We process your personal and academic data strictly for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To verify and link your account to your academic profile.</li>
              <li>To calculate and display comparative rankings (e.g., class rank, branch rank).</li>
              <li>To provide a responsive student dashboard and progress tracking charts.</li>
              <li>To handle support inquiries and academic record verification requests.</li>
              <li>To secure our portal and prevent fraudulent or abusive activities.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              4. Data Storage & Security
            </h2>
            <p>
              We employ robust administrative and technical measures to protect your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Account credentials and active sessions are managed securely through Firebase Authentication and Firebase Admin session cookies.
              </li>
              <li>
                Student profile links and academic snapshot caches are stored in a secure Neon PostgreSQL database, isolated from external access.
              </li>
              <li>
                We do not sell, rent, or trade your personal or academic information with third-party advertisers or marketers.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              5. Data Retention & Deletion
            </h2>
            <p>
              Under applicable privacy guidelines (including India&apos;s DPDP Act, 2023), you have rights regarding your data:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Consent Withdrawal:</strong> You may unlink your student profile at any time. Unlinking immediately purges your cached academic snapshot and DOB from our database.
              </li>
              <li>
                <strong>Account Deletion:</strong> You may request complete account deletion by contacting support or using the delete account features, which permanently removes your email and all associated records.
              </li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-line pt-6">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              6. Disclaimers & Official Sources
            </h2>
            <p>
              Scorlo is an <strong>unofficial</strong> platform. The official source of truth for AKTU academic records is the university&apos;s official oneview portal. We display grades as they are found on official records, but suggest verifying critical data directly with the university.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
