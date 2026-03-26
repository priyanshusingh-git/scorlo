"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function RouteContentTransition({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className={cn("animate-route-content-in flex flex-col gap-5 lg:gap-6", className)}
    >
      {children}
    </div>
  );
}
