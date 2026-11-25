import { createElement, type CSSProperties } from "react";
import { habitIcon } from "@/lib/habits/appearance";

/** Иконка привычки по ключу из базы. */
export function HabitGlyph({ icon, className, style, strokeWidth = 2 }: { icon: string; className?: string; style?: CSSProperties; strokeWidth?: number }) {
  return createElement(habitIcon(icon), { className, style, strokeWidth });
}
