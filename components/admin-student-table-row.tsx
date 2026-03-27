"use client";

import { useRouter } from "next/navigation";
import { formatBranchLabel } from "@/lib/branch-label";

type Props = {
  student: {
    id: number;
    batch_rank: number | null;
    name: string | null;
    roll_no: string;
    branch_name: string | null;
  };
};

export function AdminStudentTableRow({ student }: Props) {
  const router = useRouter();
  const href = `/admin/students/${student.id}`;

  return (
    <tr
      className="align-top transition hover:bg-app/40"
      onDoubleClick={() => router.push(href)}
    >
      <td className="px-4 py-4 font-semibold text-ink">{student.batch_rank ?? "--"}</td>
      <td className="px-4 py-4">
        <div className="font-semibold text-ink">{student.name ?? "Unnamed student"}</div>
        <div className="mt-1 text-xs text-slate">{student.roll_no}</div>
      </td>
      <td className="px-4 py-4 text-ink">{formatBranchLabel(student.branch_name)}</td>
    </tr>
  );
}
