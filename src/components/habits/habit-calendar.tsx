"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DAY_SHORT, isScheduledOnKey } from "@/lib/calculations/habits";
import type { Habit } from "@/lib/db/schemas";
import { toDayKey } from "@/lib/date";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

const monthTitle = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

interface HabitCalendarProps {
  habit: Habit;
  done: Set<string>;
  todayKey: string;
  color: string;
  onToggle: (dayKey: string) => Promise<unknown>;
}

/** Календарь месяца: история выполнения, отметка прошлых дней. */
export function HabitCalendar({ habit, done, todayKey, color, onToggle }: HabitCalendarProps) {
  const [ty, tm] = todayKey.split("-").map(Number);
  const [month, setMonth] = useState({ y: ty, m: tm - 1 });
  const [busy, setBusy] = useState<string | null>(null);

  const first = new Date(month.y, month.m, 1);
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const isCurrentMonth = month.y === ty && month.m === tm - 1;

  const go = (delta: number) => {
    haptics.selection();
    setMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const title = monthTitle.format(first).replace(" г.", "");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} aria-label="Предыдущий месяц" className="grid size-9 place-items-center rounded-full bg-muted">
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-[15px] font-semibold first-letter:uppercase">{title}</span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={isCurrentMonth}
          aria-label="Следующий месяц"
          className="grid size-9 place-items-center rounded-full bg-muted disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_SHORT.map((d) => (
          <span key={d} className="pb-1 text-[11px] font-semibold text-muted-foreground">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const key = toDayKey(new Date(month.y, month.m, i + 1));
          const isDone = done.has(key);
          const scheduled = isScheduledOnKey(habit, key);
          const future = key > todayKey;
          const isToday = key === todayKey;
          const missed = scheduled && !isDone && !future && !isToday && key >= toDayKey(new Date(habit.createdAt));
          const canToggle = !future && (scheduled || isDone) && busy === null;

          return (
            <button
              key={key}
              type="button"
              disabled={!canToggle}
              aria-pressed={isDone}
              aria-label={`${i + 1}${isDone ? ", выполнено" : missed ? ", пропущено" : ""}`}
              onClick={async () => {
                setBusy(key);
                try {
                  await onToggle(key);
                } finally {
                  setBusy(null);
                }
              }}
              className={cn(
                "tabular relative mx-auto grid aspect-square w-full max-w-10 place-items-center rounded-full text-[14px] font-semibold transition-colors",
                isDone && "text-white",
                !isDone && !scheduled && "text-subtle-foreground",
                future && "opacity-40",
                isToday && !isDone && "ring-2 ring-inset",
              )}
              style={{
                backgroundColor: isDone ? color : missed ? `color-mix(in srgb, ${color} 10%, transparent)` : undefined,
                ["--tw-ring-color" as string]: color,
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} /> выполнено
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }} /> пропущено
        </span>
        <span>Нажмите на день, чтобы изменить отметку</span>
      </div>
    </div>
  );
}
