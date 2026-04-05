"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { formatBranchLabel } from "@/lib/branch-label";

type Props = {
  serialNumber: number;
  student: {
    id: number;
    batch_rank: number | null;
    name: string | null;
    roll_no: string;
    branch_name: string | null;
  };
};

export function AdminStudentTableRow({ serialNumber, student }: Props) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const href = `/admin/students/${student.id}`;

  function openProfile() {
    if (opening) return;
    setOpening(true);
    router.push(href);
  }

  return (
    <tr
      className={`group align-top transition duration-200 ${opening ? "bg-app/60" : "cursor-pointer hover:bg-app/40"}`}
      onClick={openProfile}
    >
      <td className="px-4 py-4 font-semibold text-ink">{serialNumber}</td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-semibold text-ink transition group-hover:translate-x-[1px]">
            {student.name ?? "Unnamed student"}
          </div>
          {opening ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-slate">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Opening
            </span>
          ) : null}
        </div>
        <div className="mt-1 text-xs text-slate">{student.roll_no}</div>
      </td>
      <td className="px-4 py-4 font-semibold text-ink">{student.batch_rank ?? "--"}</td>
      <td className="px-4 py-4 text-ink">{formatBranchLabel(student.branch_name)}</td>
    </tr>
  );
}
