import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LeaderboardTabs } from "@/components/leaderboard";
import { getCurrentUserWithLink } from "@/lib/current-user-link";
import { getRankingsForStudent } from "@/lib/queries/rankings";

export default async function RankingsPage() {
  const { user, link } = await getCurrentUserWithLink();
  if (user?.role === "admin") {
    redirect("/admin");
  }
  if (!link || link.status !== "linked") {
    redirect("/");
  }

  const rankings = link.student_id ? await getRankingsForStudent(link.student_id) : null;
  if (!rankings) {
    redirect("/");
  }

  return (
    <AppShell eyebrow="Personal academic standing" title="My Ranks">
      <LeaderboardTabs rankings={rankings} />
    </AppShell>
  );
}
