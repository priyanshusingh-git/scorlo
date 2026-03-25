"use client";

import { createContext, useContext } from "react";
import type { AppUser } from "@/lib/queries/app-users";
import type { StudentAppSnapshot } from "@/lib/queries/dashboard";
import type { StudentLinkState } from "@/lib/queries/student-link";

type StudentShellState = {
  user: AppUser;
  link: StudentLinkState | null;
  snapshot: StudentAppSnapshot | null;
};

const StudentShellContext = createContext<StudentShellState | null>(null);

export function StudentShellProvider({
  value,
  children
}: {
  value: StudentShellState;
  children: React.ReactNode;
}) {
  return <StudentShellContext.Provider value={value}>{children}</StudentShellContext.Provider>;
}

export function useStudentShell() {
  const value = useContext(StudentShellContext);

  if (!value) {
    throw new Error("useStudentShell must be used within StudentShellProvider.");
  }

  return value;
}
