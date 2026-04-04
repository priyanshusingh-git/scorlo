"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AdminStudentTableRow } from "@/components/admin-student-table-row";
import { formatBranchLabel } from "@/lib/branch-label";
import { SectionBlock } from "@/components/section-block";

type StudentRow = {
  id: number;
  batch_rank: number | null;
  roll_no: string;
  name: string | null;
  branch_name: string | null;
};

type StudentsResponse = {
  rows: StudentRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  availableBranches: string[];
  availableCourses: string[];
  message?: string;
};

const STUDENTS_TABLE_CACHE = new Map<string, StudentsResponse>();

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function buildStudentsTableUrl(
  query: string,
  branch: string,
  course: string,
  page: number,
  pageSize: number
) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (branch.trim()) params.set("branch", branch.trim());
  if (course.trim()) params.set("course", course.trim());
  if (page > 1) params.set("page", String(page));
  if (pageSize !== 10) params.set("pageSize", String(pageSize));
  const next = params.toString();
  return next ? `/admin/students?${next}` : "/admin/students";
}

export function AdminStudentsTable() {
  const searchParams = useSearchParams();
  const urlQuery = useMemo(() => searchParams.get("q") ?? "", [searchParams]);
  const urlBranch = useMemo(() => searchParams.get("branch") ?? "", [searchParams]);
  const urlCourse = useMemo(() => searchParams.get("course") ?? "", [searchParams]);
  const urlPage = useMemo(() => parsePositiveInt(searchParams.get("page"), 1), [searchParams]);
  const urlPageSize = useMemo(() => parsePositiveInt(searchParams.get("pageSize"), 10), [searchParams]);
  const [draftQuery, setDraftQuery] = useState(urlQuery);
  const [query, setQuery] = useState(urlQuery);
  const [branch, setBranch] = useState(urlBranch);
  const [course, setCourse] = useState(urlCourse);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [data, setData] = useState<StudentsResponse | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraftQuery(urlQuery);
    setQuery(urlQuery);
    setBranch(urlBranch);
    setCourse(urlCourse);
    setPage(urlPage);
    setPageSize(urlPageSize);
  }, [urlBranch, urlCourse, urlPage, urlPageSize, urlQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const cacheKey = JSON.stringify({ query, branch, course, page, pageSize });
    const cached = STUDENTS_TABLE_CACHE.get(cacheKey);

    async function load() {
      if (cached) {
        setData(cached);
        setPending(false);
      } else {
        setPending(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (branch.trim()) params.set("branch", branch.trim());
        if (course.trim()) params.set("course", course.trim());
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        const response = await fetch(`/api/admin/students?${params.toString()}`, {
          signal: controller.signal
        });

        const payload = (await response.json()) as
          | ({ ok?: boolean; error?: string; message?: string } & Partial<StudentsResponse>)
          | null;

        if (!response.ok || !payload) {
          throw new Error(payload?.message ?? "Unable to load students.");
        }

        const nextData = {
          rows: payload.rows ?? [],
          totalCount: payload.totalCount ?? 0,
          page: payload.page ?? 1,
          pageSize: payload.pageSize ?? pageSize,
          availableBranches: payload.availableBranches ?? [],
          availableCourses: payload.availableCourses ?? []
        };
        STUDENTS_TABLE_CACHE.set(cacheKey, nextData);
        setData(nextData);
      } catch (loadError) {
        if ((loadError as Error).name === "AbortError") {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load students.");
      } finally {
        setPending(false);
      }
    }

    void load();

    return () => controller.abort();
  }, [branch, course, page, pageSize, query]);

  const totalCount = data?.totalCount ?? 0;
  const currentPage = data?.page ?? page;
  const currentPageSize = data?.pageSize ?? pageSize;
  const rows = data?.rows ?? [];
  const availableBranches = data?.availableBranches ?? [];
  const availableCourses = data?.availableCourses ?? [];
  const totalPages = Math.max(1, Math.ceil(totalCount / currentPageSize));

  function pushStudentsUrl(
    nextQuery: string,
    nextBranch: string,
    nextCourse: string,
    nextPage: number,
    nextPageSize: number
  ) {
    window.history.pushState({}, "", buildStudentsTableUrl(nextQuery, nextBranch, nextCourse, nextPage, nextPageSize));
  }

  return (
    <SectionBlock title="Student records">
      <div className="space-y-4">
        <form
          className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            pushStudentsUrl(draftQuery, branch, course, 1, pageSize);
            setPage(1);
            setQuery(draftQuery);
          }}
        >
          <input
            type="text"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Search by roll number, student name, or institute"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          />
          <select
            value={branch}
            onChange={(event) => {
              const nextBranch = event.target.value;
              pushStudentsUrl(query, nextBranch, course, 1, pageSize);
              setBranch(nextBranch);
              setPage(1);
            }}
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          >
            <option value="">All branches</option>
            {availableBranches.map((option) => (
              <option key={option} value={option}>
                {formatBranchLabel(option)}
              </option>
            ))}
          </select>
          <select
            value={course}
            onChange={(event) => {
              const nextCourse = event.target.value;
              pushStudentsUrl(query, branch, nextCourse, 1, pageSize);
              setCourse(nextCourse);
              setPage(1);
            }}
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          >
            <option value="">All courses</option>
            {availableCourses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate">
            <label className="inline-flex items-center gap-2">
              <span>Rows</span>
              <select
                value={String(pageSize)}
                onChange={(event) => {
                  const nextSize = Number(event.target.value);
                  pushStudentsUrl(query, branch, course, 1, nextSize);
                  setPage(1);
                  setPageSize(nextSize);
                }}
                className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>
          {pending ? (
            <div className="inline-flex items-center gap-2 text-sm text-slate">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Updating table
            </div>
          ) : null}
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="overflow-hidden rounded-[1.2rem] border border-line">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line bg-surface text-sm">
              <thead className="bg-app/80">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">
                  <th className="px-4 py-3">S. No.</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Branch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.length > 0 ? (
                  rows.map((student, index) => (
                    <AdminStudentTableRow
                      key={student.id}
                      serialNumber={(currentPage - 1) * currentPageSize + index + 1}
                      student={student}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-slate">
                      {pending ? "Loading..." : "No student records matched the search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending || currentPage <= 1}
              onClick={() => {
                const nextPage = Math.max(1, currentPage - 1);
                pushStudentsUrl(query, branch, course, nextPage, pageSize);
                setPage(nextPage);
              }}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink disabled:bg-app/60 disabled:text-slate"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pending || currentPage >= totalPages}
              onClick={() => {
                const nextPage = Math.min(totalPages, currentPage + 1);
                pushStudentsUrl(query, branch, course, nextPage, pageSize);
                setPage(nextPage);
              }}
              className="rounded-xl border border-line bg-ink px-4 py-2 text-sm font-semibold text-white disabled:bg-app/60 disabled:text-slate"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </SectionBlock>
  );
}
