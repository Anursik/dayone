"use client";

import { useNow } from "@/hooks/use-now";
import { formatWeekdayShort, getWeekDays, isSameDay } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Текущая неделя (пн–вс) по локальному времени, сегодняшний день выделен. */
export function WeekStrip({ color = "var(--primary)" }: { color?: string }) {
  const now = useNow();
  const days = now ? getWeekDays(now) : null;

  return (
    <div className="grid h-[68px] grid-cols-7 gap-1.5" aria-label="Текущая неделя">
      {days
        ? days.map((day) => {
            const today = isSameDay(day, now!);
            const future = day > now! && !today;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors",
                  today ? "text-white" : "bg-card shadow-card",
                  future && "opacity-50",
                )}
                style={today ? { backgroundColor: color } : undefined}
                aria-current={today ? "date" : undefined}
              >
                <span className={cn("text-[11px] font-semibold", today ? "text-white/80" : "text-muted-foreground")}>
                  {formatWeekdayShort(day)}
                </span>
                <span className="tabular text-[17px] font-bold">{day.getDate()}</span>
              </div>
            );
          })
        : Array.from({ length: 7 }, (_, i) => <div key={i} className="rounded-2xl bg-card shadow-card" />)}
    </div>
  );
}
