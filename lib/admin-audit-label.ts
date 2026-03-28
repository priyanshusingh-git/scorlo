const actionLabels: Record<string, string> = {
  "rankings.rebuild": "Rebuilt rankings",
  "dashboard_cache.rebuild": "Rebuilt app snapshots",
  "dashboard_cache.clear": "Cleared app snapshots",
  "students.attach": "Attached student",
  "students.detach": "Detached student",
  "students.delete": "Deleted student record",
  "student_links.update": "Updated student link",
  "student_links.delete": "Deleted student link",
  "data_requests.update": "Updated data request",
  "data_requests.delete": "Deleted data request",
  "support_issues.update": "Updated support issue"
};

const tableLabels: Record<string, string> = {
  students: "student",
  student_links: "link",
  data_requests: "request",
  student_rankings: "ranking cache",
  student_app_snapshot_cache: "app snapshot cache",
  support_issues: "support issue"
};

export function formatAdminActionLabel(actionKey: string) {
  return actionLabels[actionKey] ?? actionKey.replaceAll(".", " ");
}

export function formatAdminTargetLabel(targetTable: string, targetId: string) {
  const tableLabel = tableLabels[targetTable] ?? targetTable;
  if (targetId === "all" || targetId === "linked_students") {
    return `${tableLabel} • ${targetId.replaceAll("_", " ")}`;
  }
  return `${tableLabel} #${targetId}`;
}
