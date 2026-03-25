import { StudentPageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <StudentPageSkeleton
      eyebrow="Personal academic standing"
      title="My Ranks"
      variant="rankings"
    />
  );
}
