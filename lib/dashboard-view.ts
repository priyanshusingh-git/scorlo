import type { DashboardPayload } from "@/lib/queries/dashboard";

export type DashboardMetricTile = {
  label: string;
  value: string;
  hint: string;
  tone: "accent" | "success" | "warning" | "danger";
};

export type DashboardProgressPoint = {
  semester: string;
  value: number;
};

function parseNumericValue(value: string | null) {
  if (value === null) return null;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatMetricValue(value: string | null, fallback = "--") {
  return value ?? fallback;
}

export function buildMetricTiles(dashboard: DashboardPayload): DashboardMetricTile[] {
  const semesterCount = dashboard.semesters.length;

  return [
    {
      label: "CGPA",
      value: formatMetricValue(dashboard.metrics.cgpa),
      hint:
        semesterCount > 0
          ? `Temporary average of ${semesterCount} semester SGPAs`
          : "Waiting for semester SGPA records",
      tone: "accent"
    },
    {
      label: "Overall %",
      value: formatMetricValue(dashboard.metrics.overall_percentage),
      hint: "Stored academic aggregate from the imported record",
      tone: "warning"
    },
    {
      label: "Latest SGPA",
      value: formatMetricValue(dashboard.metrics.latest_sgpa),
      hint:
        dashboard.semesters[0] !== undefined
          ? `Semester ${dashboard.semesters[0].semester_no} result`
          : "No semester result found yet",
      tone: "success"
    },
    {
      label: "Active backs",
      value: String(dashboard.metrics.active_backs),
      hint:
        dashboard.metrics.active_backs === 0
          ? "No current carry papers"
          : "Open carry papers in the latest record",
      tone: "danger"
    }
  ];
}

export function buildProgressPoints(dashboard: DashboardPayload): DashboardProgressPoint[] {
  return dashboard.semesters
    .slice()
    .sort((left, right) => left.semester_no - right.semester_no)
    .map((semester) => ({
      semester: `Sem ${semester.semester_no}`,
      value: parseNumericValue(semester.sgpa) ?? 0
    }))
    .filter((point) => point.value > 0);
}

export function getBestSemester(dashboard: DashboardPayload) {
  return dashboard.semesters.reduce<DashboardPayload["semesters"][number] | null>((best, semester) => {
    const current = parseNumericValue(semester.sgpa);
    const bestValue = parseNumericValue(best?.sgpa ?? null);

    if (current === null) return best;
    if (bestValue === null || current > bestValue) return semester;
    return best;
  }, null);
}

export function getTrendNote(dashboard: DashboardPayload) {
  const points = buildProgressPoints(dashboard);
  if (points.length < 2) {
    return "More semester records are needed before a trend can be inferred.";
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const delta = last - first;

  if (delta >= 0.25) {
    return "The latest SGPA is meaningfully above the first recorded semester.";
  }

  if (delta <= -0.25) {
    return "The latest SGPA sits below the early baseline and needs recovery.";
  }

  return "The SGPA band is mostly steady across the recorded semesters.";
}

export function getHeroSummary(dashboard: DashboardPayload) {
  const latestSemester = dashboard.semesters[0];
  const activeBacks = dashboard.metrics.active_backs;
  const latestSignal = dashboard.metrics.overall_percentage
    ? {
        label: "Overall percentage",
        value: dashboard.metrics.overall_percentage,
        hint: "Derived academic aggregate currently stored in Neon."
      }
    : {
        label: "Latest SGPA",
        value: formatMetricValue(dashboard.metrics.latest_sgpa),
        hint: latestSemester
          ? `From Semester ${latestSemester.semester_no}`
          : "Waiting for semester records"
      };

  return {
    summary: dashboard.student.institute_name
      ? `${dashboard.student.course_name ?? "AKTU record"} at ${dashboard.student.institute_name}.`
      : "Academic record synced from Neon.",
    latestSignal,
    status:
      activeBacks === 0
        ? "No active backs"
        : `${activeBacks} active back${activeBacks === 1 ? "" : "s"}`
  };
}

export function getResultsSummary(dashboard: DashboardPayload) {
  const latestSemester = dashboard.semesters[0];
  const bestSemester = getBestSemester(dashboard);

  return {
    latestDeclaration:
      latestSemester?.date_of_declaration ?? "Declaration date unavailable",
    latestSemesterLabel: latestSemester ? `Semester ${latestSemester.semester_no}` : "No semester",
    latestStatus: latestSemester?.result_status ?? "Unknown",
    bestSemesterLabel: bestSemester ? `Semester ${bestSemester.semester_no}` : "Not available"
  };
}
