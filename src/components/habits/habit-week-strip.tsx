"use client";

import { ProgressRing } from "@/components/ui/progress-ring";
import type { DayStatus } from "@/features/habits/use-habits";
import { formatWeekdayShort, fromDayKey } from "@/lib/date";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

interface HabitWeekStripProps {
  days: DayStatus[];
  todayKey: string;
  selectedKey: string;
  onSelect: (key: string) => void;
}

/** Неделя с прогрессом выполнения по дням. Будущие дни выбрать нельзя. */
export function HabitWeekStrip({ days, todayKey, selectedKey, onSelect }: HabitWeekStripProps) {
  return (
    <div className="grid grid-cols-7 gap-1.5" role="tablist" aria-label="Дни недели">
      {days.map((day) => {
        const date = fromDayKey(day.key);
        const selected = day.key === selectedKey;
        const future = day.key > todayKey;
        const isToday = day.key === todayKey;
        const progress = day.planned > 0 ? day.done / day.planned : 0;
        const complete = day.planned > 0 && day.done === day.planned;

        return (
          <button
            key={day.key}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`${formatWeekdayShort(date)} ${date.getDate()}${isToday ? ", сегодня" : ""}: ${day.done} из ${day.planned}`}
            disabled={future}
            onClick={() => {
              if (selected) return;
              haptics.selection();
              onSelect(day.key);
            }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl py-2 transition-colors disabled:opacity-40",
              selected ? "bg-card shadow-card" : "active:bg-card/60",
            )}
          >
            <span
              className={cn(
                "text-[11px] font-semibold",
                isToday ? "text-habits" : "text-muted-foreground",
              )}
            >
              {formatWeekdayShort(date)}
            </span>
            <ProgressRing value={progress} size={34} stroke={3.5} color="var(--c-habits)">
              <span
                className={cn(
                  "tabular grid size-[26px] place-items-center rounded-full text-[13px] font-bold",
                  complete && "bg-habits text-white",
                )}
              >
                {date.getDate()}
              </span>
            </ProgressRing>
          </button>
        );
      })}
    </div>
  );
}
