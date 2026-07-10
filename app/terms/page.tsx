import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            Terms & Conditions
          </h1>
          <p className="text-sm text-slate">
            Last updated: July 11, 2026
          </p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed text-slate">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account, linking an academic profile, or using any feature on <strong>Scorlo</strong>, you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, you must not use or access the website.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              2. Account Eligibility & Registration
            </h2>
            <p>
              To use Scorlo, you must be a student of Dr. A.P.J. Abdul Kalam Technical University (AKTU) or an authorized administrator. 
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must register using an approved institutional email address.</li>
              <li>You are responsible for keeping your password and session credentials secure.</li>
              <li>You agree to notify us immediately if you suspect any unauthorized access to your account.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              3. Unofficial Portal & Data Accuracy Disclaimer
            </h2>
            <p>
              Please read this section carefully, as it governs the academic and ranking data shown on the platform:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>No Official Affiliation:</strong> Scorlo is an <strong>unofficial</strong> academic portal. It is not affiliated with, endorsed by, or connected to Dr. A.P.J. Abdul Kalam Technical University (AKTU).
              </li>
              <li>
                <strong>Academic Data Source:</strong> All grades, subjects, and SGPA/CGPA records are parsed or mirrored from public or student-submitted academic sources. The university&apos;s official oneview portal is the sole legal source of truth.
              </li>
              <li>
                <strong>Rankings and Calculations:</strong> Rankings (including class rank, branch rank, and college leaderboards) are precomputed using custom logic. These rankings are for informational and motivational purposes only and do not carry official university weight.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              4. Rules of Conduct & Profile Ownership
            </h2>
            <p>
              You agree to use the site responsibly and adhere to the following rules:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Ownership:</strong> You may only link a Roll Number and Date of Birth that belong to you. Attempting to link or access another student&apos;s academic record without express authorization is strictly prohibited.
              </li>
              <li>
                <strong>No Abuse:</strong> You must not spam the support ticket system, submit fraudulent verification claims, or submit misleading information.
              </li>
              <li>
                <strong>No Automated Access:</strong> Scraping, web-crawling, brute-forcing roll numbers, or performing automated actions using scripts on Scorlo is strictly prohibited and will result in permanent account bans.
              </li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-line pt-6">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              5. Limitation of Liability
            </h2>
            <p>
              Scorlo, its developers, and contributors shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use or inability to use the platform. This includes, but is not limited to, damages caused by errors in computed rankings, inaccuracies in academic records, service downtime, or decisions made based on the app&apos;s interface.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-ink uppercase tracking-wider">
              6. Modifications to the Service and Terms
            </h2>
            <p>
              We reserve the right to suspend, terminate, or modify Scorlo at any time without notice. We also reserve the right to update these terms. Continued use of the platform after changes are posted constitutes your acceptance of the updated terms.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
