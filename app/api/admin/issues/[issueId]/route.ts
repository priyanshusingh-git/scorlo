import { z } from "zod";
import { jsonNoStore } from "@/lib/api-response";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";
import { updateSupportIssueForAdmin } from "@/lib/queries/support";

const updateIssueSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "dismissed"]),
  adminNotes: z.string().trim().max(4000).nullable().optional()
});

export async function PATCH(request: Request, context: { params: Promise<{ issueId: string }> }) {
  const admin = await getCurrentAdminSessionUser();
  if (!admin) {
    return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
  }
  if (!isMainAdminUser(admin)) {
    return jsonNoStore({ error: "forbidden", message: "Only the main admin can manage support issues." }, { status: 403 });
  }

  try {
    const { issueId } = await context.params;
    const parsedIssueId = Number(issueId);

    if (!Number.isInteger(parsedIssueId) || parsedIssueId <= 0) {
      return jsonNoStore({ error: "invalid_issue_id", message: "Invalid issue id." }, { status: 400 });
    }

    const parsed = updateIssueSchema.parse(await request.json());
    await updateSupportIssueForAdmin({
      issueId: parsedIssueId,
      status: parsed.status,
      adminNotes: parsed.adminNotes?.trim() || null,
      adminUserId: admin.id
    });

    return jsonNoStore({
      ok: true,
      message: "Issue updated."
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonNoStore(
        { error: "invalid_issue_update", message: error.issues[0]?.message ?? "Invalid issue update." },
        { status: 400 }
      );
    }

    return jsonNoStore(
      {
        error: "issue_update_failed",
        message: error instanceof Error ? error.message : "Unable to update the issue."
      },
      { status: 400 }
    );
  }
}
