"use client";

import { Minus, Plus } from "lucide-react";
import { haptics } from "@/lib/telegram/haptics";

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  format?: (v: number) => string;
}

/** Компактный счётчик «− значение +» для быстрого ввода одной рукой. */
export function Stepper({ label, value, onChange, step = 1, min = 0, max = 9999, suffix, format }: StepperProps) {
  const change = (delta: number) => {
    const next = Math.min(max, Math.max(min, Math.round((value + delta) * 100) / 100));
    if (next !== value) {
      haptics.selection();
      onChange(next);
    }
  };
  return (
    <div className="min-w-0">
      <p className="mb-1 truncate px-1 text-[12px] font-medium text-muted-foreground">{label}</p>
      <div className="flex h-11 items-center rounded-2xl bg-muted">
        <button type="button" aria-label={`${label}: уменьшить`} onClick={() => change(-step)} disabled={value <= min} className="grid h-full w-9 shrink-0 place-items-center text-muted-foreground disabled:opacity-30">
          <Minus className="size-4" />
        </button>
        <span className="tabular min-w-0 flex-1 truncate text-center text-[15px] font-semibold" aria-live="polite" aria-label={label}>
          {format ? format(value) : value}
          {suffix ? <span className="text-[12px] font-medium text-muted-foreground"> {suffix}</span> : null}
        </span>
        <button type="button" aria-label={`${label}: увеличить`} onClick={() => change(step)} disabled={value >= max} className="grid h-full w-9 shrink-0 place-items-center text-muted-foreground disabled:opacity-30">
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
