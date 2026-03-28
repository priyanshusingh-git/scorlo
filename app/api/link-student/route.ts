import { jsonNoStore } from "@/lib/api-response";
import { ZodError, z } from "zod";
import { getCurrentSessionUser } from "@/lib/auth/session";
import {
  StudentLinkConflictError,
  linkStudentRecord
} from "@/lib/queries/student-link";

const linkSchema = z.object({
  rollNo: z.string().min(8).max(32),
  dob: z.string().regex(/^\d{2}-\d{2}-\d{4}$/)
});

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return jsonNoStore({ error: "unauthorized" }, { status: 401 });
  }

  if (user.role !== "student") {
    return jsonNoStore(
      { error: "forbidden", message: "Only student accounts can link academic records." },
      { status: 403 }
    );
  }

  try {
    const body = linkSchema.parse(await request.json());
    const result = await linkStudentRecord({
      appUserId: user.id,
      rollNo: body.rollNo,
      dob: body.dob
    });

    return jsonNoStore({
      ok: true,
      link: result.link,
      message: result.message
    });
  } catch (error: any) {
    console.error("[api/link-student] error", error);

    if (error instanceof ZodError) {
      return jsonNoStore(
        { error: "invalid_request", message: "Enter a valid roll number and date of birth." },
        { status: 400 }
      );
    }

    if (error instanceof StudentLinkConflictError) {
      return jsonNoStore(
        { error: "student_link_conflict", message: error.message },
        { status: 409 }
      );
    }

    const isProd = process.env.NODE_ENV === "production";
    return jsonNoStore(
      { 
        error: "internal_server_error", 
        message: "An unexpected error occurred while linking your academic record.",
        details: isProd ? undefined : (error instanceof Error ? error.message : "Unknown error"),
        stack: isProd ? undefined : (error instanceof Error ? error.stack : undefined)
      },
      { status: 500 }
    );
  }
}
