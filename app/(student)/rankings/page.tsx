"use client";

import { AppShell } from "@/components/app-shell";
import { ClientRedirect } from "@/components/client-redirect";
import { LeaderboardTabs } from "@/components/leaderboard";
import { useStudentShell } from "@/components/student-shell-provider";

export default function RankingsPage() {
  const { link, snapshot } = useStudentShell();

  if (!link || link.status !== "linked") {
    return <ClientRedirect href="/" />;
  }

  const rankings = snapshot?.rankings ?? null;
  if (!rankings) {
    return <ClientRedirect href="/" />;
  }

  return (
    <AppShell eyebrow="Personal academic standing" title="My Ranks">
      <LeaderboardTabs rankings={rankings} />
    </AppShell>
  );
}
