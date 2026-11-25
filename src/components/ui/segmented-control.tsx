"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex rounded-2xl bg-muted p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              if (active) return;
              haptics.selection();
              onChange(option.value);
            }}
            className={cn(
              "relative flex-1 rounded-xl px-3 py-2 text-[14px] font-semibold transition-colors",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`segment-${id}`}
                className="absolute inset-0 rounded-xl bg-card shadow-[0_1px_3px_rgb(0_0_0/0.08)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
