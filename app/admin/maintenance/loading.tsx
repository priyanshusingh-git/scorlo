import { AdminPageSkeleton } from "@/components/admin-page-skeleton";

export default function Loading() {
  return (
    <AdminPageSkeleton
      eyebrow="Internal maintenance"
      title="Maintenance"
      variant="maintenance"
    />
  );
}
