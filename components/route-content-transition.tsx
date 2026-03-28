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
  usePathname();

  return (
    <div className={cn("flex flex-col gap-5 lg:gap-6", className)}>
      {children}
    </div>
  );
}
