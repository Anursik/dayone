"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatLongDate, fromDayKey, shiftDayKey } from "@/lib/date";
import { haptics } from "@/lib/telegram/haptics";

export function dayTitle(dayKey: string, todayKey: string): string {
  if (dayKey === todayKey) return "Сегодня";
  if (dayKey === shiftDayKey(todayKey, -1)) return "Вчера";
  return formatLongDate(fromDayKey(dayKey));
}

/** Переключение дней для просмотра истории. Будущие дни недоступны. */
export function DayNavigator({ dayKey, todayKey, onChange }: { dayKey: string; todayKey: string; onChange: (key: string) => void }) {
  const go = (delta: number) => {
    haptics.selection();
    onChange(shiftDayKey(dayKey, delta));
  };
  const isToday = dayKey === todayKey;

  return (
    <div className="mb-3 flex items-center gap-2 rounded-2xl bg-card p-1.5 shadow-card">
      <button type="button" aria-label="Предыдущий день" onClick={() => go(-1)} className="grid size-10 place-items-center rounded-xl active:bg-muted">
        <ChevronLeft className="size-5" />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p className="truncate text-[15px] font-semibold">{dayTitle(dayKey, todayKey)}</p>
        {!isToday && dayKey !== shiftDayKey(todayKey, -1) ? null : (
          <p className="text-[12px] text-muted-foreground">{formatLongDate(fromDayKey(dayKey))}</p>
        )}
      </div>
      <button
        type="button"
        aria-label="Следующий день"
        disabled={isToday}
        onClick={() => go(1)}
        className="grid size-10 place-items-center rounded-xl active:bg-muted disabled:opacity-30"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
