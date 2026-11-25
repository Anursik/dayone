"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { DayStatus } from "@/features/habits/use-habits";
import type { RangeStats } from "@/lib/calculations/habits";
import { formatWeekdayShort, fromDayKey } from "@/lib/date";

function Rate({ label, stats }: { label: string; stats: RangeStats }) {
  return (
    <div className="flex-1">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="tabular text-[24px] leading-tight font-bold tracking-tight">
        {stats.rate === null ? "—" : `${Math.round(stats.rate * 100)}%`}
      </p>
      <p className="tabular text-[12.5px] text-muted-foreground">
        {stats.planned > 0 ? `${stats.done} из ${stats.planned}` : "нет данных"}
      </p>
    </div>
  );
}

/** Выполнение за неделю и месяц + столбики последних 7 дней. */
export function HabitStatsCard({ week, month, last7, todayKey }: { week: RangeStats; month: RangeStats; last7: DayStatus[]; todayKey: string }) {
  return (
    <Card>
      <div className="flex gap-3">
        <Rate label="Эта неделя" stats={week} />
        <Rate label="Этот месяц" stats={month} />
      </div>
      <div className="mt-4 flex h-[84px] items-end gap-2" aria-label="Выполнение за последние 7 дней">
        {last7.map((d) => {
          const rate = d.planned > 0 ? d.done / d.planned : 0;
          const isToday = d.key === todayKey;
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex h-[60px] w-full items-end overflow-hidden rounded-lg bg-muted">
                <motion.div
                  className="w-full rounded-lg bg-habits"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(rate * 100, d.done > 0 ? 8 : 0)}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  title={`${d.done} из ${d.planned}`}
                />
              </div>
              <span className={isToday ? "text-[11px] font-bold text-habits" : "text-[11px] font-semibold text-muted-foreground"}>
                {formatWeekdayShort(fromDayKey(d.key))}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
