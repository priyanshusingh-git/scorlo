export const AKTU_SEMESTER_CREDITS: Record<number, number> = {
  1: 22,
  2: 22,
  3: 23,
  4: 21,
  5: 23,
  6: 21,
  7: 19,
  8: 16
};

export function parseNumericMetric(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;

  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value).trim());

  return Number.isFinite(parsed) ? parsed : null;
}

export function computeAktuWeightedCgpa(
  semesters: Array<{
    semester_no: number;
    sgpa: string | number | null;
  }>
) {
  let weightedPoints = 0;
  let totalCredits = 0;

  for (const semester of semesters) {
    const sgpa = parseNumericMetric(semester.sgpa);
    const credits = AKTU_SEMESTER_CREDITS[semester.semester_no];

    if (sgpa === null || credits === undefined) continue;

    weightedPoints += sgpa * credits;
    totalCredits += credits;
  }

  return totalCredits === 0 ? null : weightedPoints / totalCredits;
}

export function formatMetric(value: number | null) {
  return value === null ? null : value.toFixed(2);
}
