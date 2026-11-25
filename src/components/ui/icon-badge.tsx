import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconBadgeProps {
  icon: LucideIcon;
  /** CSS-цвет акцента, например var(--c-habits) */
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "size-8 rounded-[10px] [&_svg]:size-4",
  md: "size-10 rounded-xl [&_svg]:size-5",
  lg: "size-14 rounded-2xl [&_svg]:size-7",
};

/** Иконка в мягкой цветной подложке — единый стиль иконок разделов. */
export function IconBadge({ icon: Icon, color, size = "md", className }: IconBadgeProps) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center", sizes[size], className)}
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <Icon strokeWidth={2.2} />
    </span>
  );
}
