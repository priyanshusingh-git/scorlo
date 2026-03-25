import { requireStudentSession } from "@/lib/auth/session";
import { getStudentLinkForUser } from "@/lib/queries/student-link";
import { getStudentAppSnapshot } from "@/lib/queries/dashboard";
import { StudentShellProvider } from "@/components/student-shell-provider";

export default async function StudentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireStudentSession();
  const link = await getStudentLinkForUser(user.id);
  const snapshot =
    link?.status === "linked" && link.student_id
      ? await getStudentAppSnapshot(link.student_id)
      : null;

  return (
    <StudentShellProvider
      value={{
        user,
        link,
        snapshot
      }}
    >
      {children}
    </StudentShellProvider>
  );
}
