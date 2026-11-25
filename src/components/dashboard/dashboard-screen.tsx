"use client";

import { Droplets, Dumbbell, ListChecks, Moon } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { useDashboardSummary } from "@/features/dashboard/use-dashboard-summary";
import { formatDuration, formatLiters, plural } from "@/lib/format";
import { DashboardHeader } from "./dashboard-header";
import { DayProgressCard } from "./day-progress-card";
import { NutritionSummaryCard } from "./nutrition-summary-card";
import { QuickActions } from "./quick-actions";
import { StatTile } from "./stat-tile";

const workoutDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

export function DashboardScreen() {
  const { summary } = useDashboardSummary();
  const { habits, water, sleep, lastWorkout } = summary;

  return (
    <>
      <DashboardHeader profileName={summary.profileName} />
      <DayProgressCard summary={summary} />

      <SectionTitle>Быстрый переход</SectionTitle>
      <QuickActions />

      <SectionTitle>Сегодня</SectionTitle>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            href="/habits"
            icon={ListChecks}
            color="var(--c-habits)"
            label="Привычки"
            value={habits.total > 0 ? `${habits.done}/${habits.total}` : "0"}
            hint={
              habits.total > 0
                ? `${habits.done} ${plural(habits.done, ["выполнена", "выполнены", "выполнено"])}`
                : "Привычек пока нет"
            }
            progress={habits.total > 0 ? habits.done / habits.total : null}
          />
          <StatTile
            href="/profile/health"
            icon={Droplets}
            color="var(--c-water)"
            label="Вода"
            value={formatLiters(water.ml)}
            hint={water.goalMl ? `из ${formatLiters(water.goalMl)}` : "Цель не задана"}
            progress={water.goalMl ? water.ml / water.goalMl : null}
          />
        </div>

        <NutritionSummaryCard nutrition={summary.nutrition} />

        <div className="grid grid-cols-2 gap-3">
          <StatTile
            href="/profile/health"
            icon={Moon}
            color="var(--c-sleep)"
            label="Сон"
            value={sleep.minutes !== null ? formatDuration(sleep.minutes) : "—"}
            hint={
              sleep.minutes === null
                ? "Нет записи за ночь"
                : sleep.goalMinutes
                  ? `цель ${formatDuration(sleep.goalMinutes)}`
                  : "Цель не задана"
            }
            progress={sleep.minutes !== null && sleep.goalMinutes ? sleep.minutes / sleep.goalMinutes : null}
          />
          <StatTile
            href="/workouts"
            icon={Dumbbell}
            color="var(--c-workouts)"
            label="Тренировка"
            value={lastWorkout ? workoutDate.format(lastWorkout.date) : "—"}
            hint={lastWorkout ? lastWorkout.title : "Тренировок пока нет"}
          />
        </div>
      </div>
    </>
  );
}
