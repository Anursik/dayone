"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";
import { IconBadge } from "./icon-badge";

interface ListRowBaseProps {
  icon?: LucideIcon;
  color?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  className?: string;
}

function RowContent({ icon, color = "var(--muted-foreground)", title, subtitle, trailing }: ListRowBaseProps) {
  return (
    <>
      {icon ? <IconBadge icon={icon} color={color} size="sm" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>
        {subtitle ? <span className="block truncate text-[13px] text-muted-foreground">{subtitle}</span> : null}
      </span>
      {trailing}
    </>
  );
}

const rowClass = "flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-left";

/** Строка-ссылка в стиле списков iOS. */
export function ListRowLink({ href, className, ...props }: ListRowBaseProps & { href: string }) {
  return (
    <Link
      href={href}
      onClick={() => haptics.selection()}
      className={cn(rowClass, "transition-colors active:bg-muted", className)}
    >
      <RowContent {...props} trailing={props.trailing ?? <ChevronRight className="size-[18px] text-subtle-foreground" />} />
    </Link>
  );
}

/** Строка с произвольным элементом справа (переключатель, значение). */
export function ListRow({ className, ...props }: ListRowBaseProps) {
  return (
    <div className={cn(rowClass, className)}>
      <RowContent {...props} />
    </div>
  );
}

/** Группа строк с разделителями. */
export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-card)] bg-card shadow-card [&>*+*]:border-t [&>*+*]:border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}
