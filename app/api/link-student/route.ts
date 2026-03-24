import { NextResponse } from "next/server";
import { z } from "zod";
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
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = linkSchema.parse(await request.json());
  try {
    const result = await linkStudentRecord({
      appUserId: user.id,
      rollNo: body.rollNo,
      dob: body.dob
    });

    return NextResponse.json({
      ok: true,
      link: result.link,
      message: result.message
    });
  } catch (error: any) {
    console.error("[api/link-student] error", error);

    if (error instanceof StudentLinkConflictError) {
      return NextResponse.json(
        { error: "student_link_conflict", message: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: "internal_server_error", 
        message: "An unexpected error occurred while linking your academic record.",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
