"use client";

import { motion } from "framer-motion";
import { clamp, cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  color?: string;
  className?: string;
  label?: string;
}

export function ProgressBar({ value, color = "var(--primary)", className, label }: ProgressBarProps) {
  const progress = clamp(Number.isFinite(value) ? value : 0, 0, 1);
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
