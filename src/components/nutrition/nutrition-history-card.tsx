"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { HistoryDay } from "@/features/nutrition/use-nutrition";
import { formatWeekdayShort, fromDayKey } from "@/lib/date";
import { formatNumber } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

interface Props {
  days: HistoryDay[];
  average: number | null;
  loggedDays: number;
  goal: number | null;
  selectedKey: string;
  onSelect: (key: string) => void;
}

/** Калории за 7 дней: столбики с линией нормы, нажатие открывает день. */
export function NutritionHistoryCard({ days, average, loggedDays, goal, selectedKey, onSelect }: Props) {
  const max = Math.max(goal ?? 0, ...days.map((d) => d.kcal), 1);

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">Среднее за дни с записями</p>
        <p className="tabular text-[13px] text-muted-foreground">{loggedDays} из 7 дн.</p>
      </div>
      <p className="tabular text-[24px] leading-tight font-bold tracking-tight">
        {average === null ? "—" : formatNumber(average)}
        <span className="text-[14px] font-semibold text-muted-foreground"> ккал</span>
      </p>

      <div className="relative mt-4 flex h-[104px] items-end gap-2">
        {goal ? (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-nutrition/60"
            style={{ bottom: `calc(${(goal / max) * 80}px + 22px)` }}
            aria-hidden
          />
        ) : null}
        {days.map((d) => {
          const selected = d.key === selectedKey;
          const over = goal !== null && d.kcal > goal * 1.05;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => {
                haptics.selection();
                onSelect(d.key);
              }}
              aria-label={`${formatWeekdayShort(fromDayKey(d.key))}: ${formatNumber(d.kcal)} ккал`}
              aria-pressed={selected}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <div className="flex h-20 w-full items-end overflow-hidden rounded-lg bg-muted">
                <motion.div
                  className={cn("w-full rounded-lg", over ? "bg-destructive" : "bg-chart-nutrition", !selected && "opacity-70")}
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.kcal / max) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className={cn("text-[11px] font-semibold", selected ? "text-nutrition" : "text-muted-foreground")}>
                {formatWeekdayShort(fromDayKey(d.key))}
              </span>
            </button>
          );
        })}
      </div>
      {goal ? <p className="mt-2 text-[12px] text-muted-foreground">Пунктир — норма {formatNumber(goal)} ккал</p> : null}
    </Card>
  );
}
