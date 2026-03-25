import { Suspense } from "react";
import { AdminDangerButton, AdminStudentAttachForm } from "@/components/admin-actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminSectionFallback } from "@/components/admin-stream-fallback";
import { SectionBlock } from "@/components/section-block";
import { StatusBadge } from "@/components/status-badge";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminStudentDetail, searchAdminStudents } from "@/lib/queries/admin";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminStudentsPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const studentIdValue = typeof params.studentId === "string" ? Number(params.studentId) : null;
  const studentsPromise = searchAdminStudents({ query });
  const detailPromise =
    studentIdValue && Number.isInteger(studentIdValue) && studentIdValue > 0
      ? getAdminStudentDetail(studentIdValue)
      : Promise.resolve(null);

  return (
    <AdminShell eyebrow="Academic records" title="Students">
      <SectionBlock title="Search students">
        <form className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by roll number, student name, or institute"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          />
          <button className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">Search</button>
        </form>
      </SectionBlock>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <Suspense
        fallback={
          <AdminSectionFallback
            title="Search results"
            description=""
            rows={4}
          />
        }
        >
          <StudentSearchResults studentsPromise={studentsPromise} query={query} />
        </Suspense>

        <Suspense
        fallback={
          <AdminSectionFallback
            title="Student detail"
            description=""
            rows={5}
          />
        }
        >
          <StudentDetailSection detailPromise={detailPromise} />
        </Suspense>
      </section>
    </AdminShell>
  );
}

async function StudentSearchResults({
  studentsPromise,
  query
}: {
  studentsPromise: ReturnType<typeof searchAdminStudents>;
  query: string;
}) {
  const students = await studentsPromise;

  return (
    <SectionBlock title="Search results">
      <div className="space-y-3">
        {students.map((student) => (
          <a
            key={student.id}
            href={`/admin/students?q=${encodeURIComponent(query)}&studentId=${student.id}`}
            className="block rounded-[1.2rem] border border-line bg-surface px-4 py-4 transition hover:border-accent/40 hover:bg-app/70"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={student.linked_app_user_id ? "success" : "warning"}>
                {student.linked_app_user_id ? "Linked" : "Unlinked"}
              </StatusBadge>
              {student.passing_year ? <StatusBadge tone="info">Batch {student.passing_year}</StatusBadge> : null}
            </div>
            <div className="mt-3 text-sm font-semibold text-ink">
              {student.name ?? "Unnamed student"} • {student.roll_no}
            </div>
            <div className="mt-1 text-sm text-slate">
              {student.branch_name ?? "Branch unavailable"} • CGPA {student.cgpa ?? "--"} • Latest SGPA{" "}
              {student.latest_sgpa ?? "--"}
            </div>
          </a>
        ))}
        {students.length === 0 ? <p className="text-sm text-slate">No student records matched the search.</p> : null}
      </div>
    </SectionBlock>
  );
}

async function StudentDetailSection({
  detailPromise
}: {
  detailPromise: Promise<Awaited<ReturnType<typeof getAdminStudentDetail>>>;
}) {
  const detail = await detailPromise;

  return (
    <SectionBlock
      title={detail ? `${detail.name ?? "Student"} • ${detail.roll_no}` : "Student detail"}
      description={
        detail
          ? `${detail.institute_name ?? "Institute unavailable"} • ${detail.course_name ?? "Course unavailable"}`
          : "Select a student from the search results to inspect and mutate the record."
      }
    >
      {detail ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={detail.linked_app_user_id ? "success" : "warning"}>
              {detail.linked_app_user_id ? `Linked user #${detail.linked_app_user_id}` : "No linked app user"}
            </StatusBadge>
            <StatusBadge tone="accent">Overall % {detail.overall_percentage ?? "--"}</StatusBadge>
            <StatusBadge tone="info">Active backs {detail.active_backs}</StatusBadge>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoTile label="Linked email" value={detail.linked_email ?? "Not linked"} />
            <InfoTile label="Stored DOB" value={detail.linked_dob ?? "Not stored"} />
            <InfoTile label="CGPA" value={detail.cgpa ?? "--"} />
            <InfoTile label="Latest SGPA" value={detail.latest_sgpa ?? "--"} />
          </div>

          <div className="rounded-[1.2rem] border border-line bg-app/70 px-4 py-4">
            <div className="mb-3 text-sm font-semibold text-ink">Manual attachment</div>
            <AdminStudentAttachForm studentId={detail.id} />
            {detail.linked_app_user_id ? (
              <div className="mt-3">
                <AdminDangerButton
                  label="Detach linked app user"
                  url={`/api/admin/students/${detail.id}/link`}
                  confirmMessage="Detach this student from the linked app user and move the account back to pending_data?"
                  successMessage="Student detached."
                />
              </div>
            ) : null}
          </div>

          <SectionBlock title="Recent semesters">
            <div className="space-y-3">
              {detail.recent_semesters.map((semester) => (
                <div
                  key={semester.semester_no}
                  className="rounded-[1.1rem] border border-line bg-surface px-4 py-3"
                >
                  <div className="text-sm font-semibold text-ink">Semester {semester.semester_no}</div>
                  <div className="mt-1 text-sm text-slate">
                    SGPA {semester.sgpa ?? "--"} • {semester.result_status ?? "Unknown"} •{" "}
                    {semester.session_id ?? "No session"} {semester.session_type ?? ""}
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>

          <AdminDangerButton
            label="Delete student academic record"
            url={`/api/admin/students/${detail.id}`}
            confirmMessage={`Delete the academic record for ${detail.roll_no}? This removes dependent academic tables and resets any linked app account.`}
            successMessage="Student record deleted."
          />
        </div>
      ) : (
          <p className="text-sm leading-7 text-slate">
          Select a student to view the record.
        </p>
      )}
    </SectionBlock>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-surface px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-mist">{label}</div>
      <div className="mt-1 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
