import { getDb } from "@/lib/db/database";
import { PROFILE_ID } from "@/lib/db/schemas";
import { withDataErrors } from "@/lib/db/errors";
import { fromDayKey } from "@/lib/date";
import { isHabitScheduledOn } from "@/lib/calculations/habits";
import { sumMacros } from "@/lib/calculations/nutrition";
import type { DashboardSummary } from "@/types/dashboard";

/**
 * Сводка дня для главного экрана. Все значения считаются из локальной базы.
 * Функция читает только через Dexie, поэтому её можно передавать в live-запрос:
 * сводка пересчитается после любого изменения связанных таблиц.
 */
async function getDaySummary(dayKey: string): Promise<DashboardSummary> {
  const db = getDb();
  const day = fromDayKey(dayKey);

  const [profile, habits, habitLogs, meals, water, sleep, lastSession] = await Promise.all([
    db.profile.get(PROFILE_ID),
    db.habits.toArray(),
    db.habitLogs.where("date").equals(dayKey).toArray(),
    db.mealEntries.where("date").equals(dayKey).toArray(),
    db.healthEntries.where("[type+date]").equals(["water", dayKey]).toArray(),
    db.healthEntries.where("[type+date]").equals(["sleep", dayKey]).toArray(),
    db.workoutSessions
      .orderBy("startedAt")
      .reverse()
      .filter((s) => s.finishedAt !== null)
      .first(),
  ]);

  const goals = profile?.goals;
  const scheduled = habits.filter((h) => isHabitScheduledOn(h, day));
  const scheduledIds = new Set(scheduled.map((h) => h.id));
  const doneIds = new Set(habitLogs.filter((l) => scheduledIds.has(l.habitId)).map((l) => l.habitId));
  const eaten = sumMacros(meals);

  return {
    profileName: profile?.name || null,
    habits: { done: doneIds.size, total: scheduled.length },
    nutrition: {
      calories: eaten.kcal,
      caloriesGoal: goals?.caloriesKcal ?? null,
      protein: { eaten: eaten.protein, goal: goals?.proteinG ?? null },
      fat: { eaten: eaten.fat, goal: goals?.fatG ?? null },
      carbs: { eaten: eaten.carbs, goal: goals?.carbsG ?? null },
    },
    water: { ml: water.reduce((s, e) => s + e.value, 0), goalMl: goals?.waterMl ?? null },
    sleep: {
      minutes: sleep.length ? sleep.reduce((s, e) => s + e.value, 0) : null,
      goalMinutes: goals?.sleepMinutes ?? null,
    },
    lastWorkout: lastSession
      ? {
          title: lastSession.title,
          date: new Date(lastSession.startedAt),
          durationMinutes: lastSession.finishedAt
            ? Math.round((lastSession.finishedAt - lastSession.startedAt) / 60000)
            : null,
        }
      : null,
  };
}

export const dashboardRepository = {
  getDaySummary: (dayKey: string) => withDataErrors(() => getDaySummary(dayKey)),
};
