import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconBadge } from "./icon-badge";

interface EmptyStateProps {
  icon: LucideIcon;
  color: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, color, title, description, children, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <IconBadge icon={icon} color={color} size="lg" />
      <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-[280px] text-[14px] leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {children ? <div className="mt-5 w-full">{children}</div> : null}
    </div>
  );
}
