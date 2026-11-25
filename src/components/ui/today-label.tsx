"use client";

import { useNow } from "@/hooks/use-now";
import { formatLongDate } from "@/lib/date";

/** Сегодняшняя дата по локальному времени устройства (пустая строка до гидратации). */
export function TodayLabel() {
  const now = useNow();
  return <span className="inline-block min-h-[1.25em]">{now ? formatLongDate(now) : ""}</span>;
}
