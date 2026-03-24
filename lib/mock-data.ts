export type Metric = {
  label: string;
  value: string;
  hint: string;
  tone: "accent" | "success" | "warning" | "danger";
};

export type SemesterSubject = {
  code: string;
  name: string;
  internal: number;
  external: number;
  total: number;
  grade: string;
  status?: "back" | "cleared";
};

export type Semester = {
  semester: number;
  sgpa: string;
  totalMarks: number;
  resultStatus: string;
  declaredOn: string;
  subjects: SemesterSubject[];
};

export const profile = {
  name: "Priyanshu Singh",
  branch: "Information Technology",
  batch: "2027",
  rollNo: "2301920130136",
  email: "priyanshu267a@gmail.com",
  summary: "A calmer way to read AKTU performance, one semester at a time."
};

export const metrics: Metric[] = [
  { label: "CGPA", value: "8.14", hint: "Stable over 5 semesters", tone: "accent" },
  { label: "Overall %", value: "78.6", hint: "Calculated from totals", tone: "warning" },
  { label: "Latest SGPA", value: "7.57", hint: "Semester 5 result", tone: "success" },
  { label: "Active backs", value: "0", hint: "All cleared currently", tone: "danger" }
];

export const progress = [
  { semester: "Sem 1", value: 7.45 },
  { semester: "Sem 2", value: 8.45 },
  { semester: "Sem 3", value: 8.12 },
  { semester: "Sem 4", value: 8.22 },
  { semester: "Sem 5", value: 7.57 }
];

export const semesters: Semester[] = [
  {
    semester: 5,
    sgpa: "7.57",
    totalMarks: 668,
    resultStatus: "CP(0)",
    declaredOn: "25 Jun 2025",
    subjects: [
      { code: "KCS501", name: "Compiler Design", internal: 28, external: 46, total: 74, grade: "A" },
      { code: "KCS503", name: "Web Technology", internal: 23, external: 45, total: 68, grade: "B+" },
      { code: "KCS055", name: "Mini Project", internal: 47, external: 45, total: 92, grade: "A+" }
    ]
  },
  {
    semester: 4,
    sgpa: "8.22",
    totalMarks: 843,
    resultStatus: "PASS",
    declaredOn: "12 Jan 2025",
    subjects: [
      { code: "KCS401", name: "Operating Systems", internal: 27, external: 48, total: 75, grade: "A" },
      { code: "KCS402", name: "DAA", internal: 25, external: 45, total: 70, grade: "A" }
    ]
  },
  {
    semester: 1,
    sgpa: "5.73",
    totalMarks: 571,
    resultStatus: "CP(1)",
    declaredOn: "25 Jun 2024",
    subjects: [
      { code: "BEC101", name: "Fundamentals of Electronics", internal: 25, external: 9, total: 34, grade: "F", status: "cleared" },
      { code: "BAS103", name: "Engineering Mathematics-I", internal: 24, external: 30, total: 54, grade: "C" }
    ]
  }
];

export const leaderboard = [
  { rank: 1, name: "A*** S***", score: "86.2%" },
  { rank: 2, name: "R*** K***", score: "84.9%" },
  { rank: 3, name: "V*** G***", score: "84.3%" },
  { rank: 14, name: "Priyanshu Singh", score: "78.6%", self: true },
  { rank: 15, name: "P*** Y***", score: "78.1%" },
  { rank: 16, name: "A*** J***", score: "77.8%" }
];
