import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2.5 mt-6 flex items-end justify-between px-1", className)}>
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}
