import { headers } from "next/headers";
import { z } from "zod";
import { jsonNoStore } from "@/lib/api-response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getStudentLinkForUser } from "@/lib/queries/student-link";
import { rateLimit } from "@/lib/rate-limiter";
import { createSupportIssue, listSupportIssuesForStudentPaginated } from "@/lib/queries/support";

const createIssueSchema = z.object({
  issueType: z.enum(["wrong_data", "missing_record", "link_problem", "account_issue", "other"]),
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().min(10).max(4000)
});

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return jsonNoStore({ error: "unauthorized", message: "Student session required." }, { status: 401 });
  }
  if (user.role !== "student") {
    return jsonNoStore(
      { error: "forbidden", message: "Only student accounts can access support issues." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 5);
  const result = await listSupportIssuesForStudentPaginated({
    appUserId: user.id,
    page,
    pageSize
  });

  return jsonNoStore({ ok: true, ...result });
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return jsonNoStore({ error: "unauthorized", message: "Student session required." }, { status: 401 });
  }
  if (user.role !== "student") {
    return jsonNoStore(
      { error: "forbidden", message: "Only student accounts can submit support issues." },
      { status: 403 }
    );
  }

  try {
    const head = await headers();
    const forwardedFor = head.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || head.get("x-real-ip") || "anonymous";
    const limit = await rateLimit(`${user.id}:${ip}`, {
      scope: "support_issue_create",
      limit: 5,
      windowMs: 15 * 60 * 1000
    });

    if (!limit.success) {
      return jsonNoStore(
        {
          error: "too_many_requests",
          message: "Too many issue submissions. Please wait a bit before sending another one."
        },
        { status: 429 }
      );
    }

    const parsed = createIssueSchema.parse(await request.json());
    const link = await getStudentLinkForUser(user.id);

    const issueId = await createSupportIssue({
      appUserId: user.id,
      studentId: link?.student_id ?? null,
      rollNo: link?.roll_no ?? null,
      linkStatus: link?.status ?? null,
      issueType: parsed.issueType,
      title: parsed.title,
      description: parsed.description
    });

    return jsonNoStore({
      ok: true,
      issueId,
      message: "Issue submitted. An admin can review it now."
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonNoStore(
        { error: "invalid_issue_payload", message: error.issues[0]?.message ?? "Invalid issue details." },
        { status: 400 }
      );
    }

    return jsonNoStore(
      {
        error: "issue_create_failed",
        message: error instanceof Error ? error.message : "Unable to submit the issue."
      },
      { status: 400 }
    );
  }
}
