import { AdminPageSkeleton } from "@/components/admin-page-skeleton";

export default function Loading() {
  return (
    <AdminPageSkeleton
      eyebrow="Student user management"
      title="Student Users"
      variant="list"
    />
  );
}
