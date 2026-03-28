"use client";

import { ClientRedirect } from "@/components/client-redirect";
import { LeaderboardTabs } from "@/components/leaderboard";
import { useStudentShell } from "@/components/student-shell-provider";

export default function RankingsPage() {
  const { link, snapshot } = useStudentShell();

  if (!link || link.status !== "linked") {
    return <ClientRedirect href="/profile" />;
  }

  const rankings = snapshot?.rankings ?? null;
  if (!rankings) {
    return <ClientRedirect href="/profile" />;
  }

  return (
    <>
      <LeaderboardTabs rankings={rankings} />
    </>
  );
}
