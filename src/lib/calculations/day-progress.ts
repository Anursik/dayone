import type { DashboardSummary } from "@/types/dashboard";
import { clamp } from "@/lib/utils";

export interface DayProgressPart {
  key: "habits" | "calories" | "water" | "sleep";
  label: string;
  value: number; // 0..1
}

/**
 * Общий прогресс дня — среднее по показателям, для которых есть цель.
 * Если ни одной цели нет — прогресс не определён (null), а не 0%.
 */
export function calculateDayProgress(summary: DashboardSummary): { value: number | null; parts: DayProgressPart[] } {
  const parts: DayProgressPart[] = [];

  if (summary.habits.total > 0) {
    parts.push({ key: "habits", label: "Привычки", value: summary.habits.done / summary.habits.total });
  }
  if (summary.nutrition.caloriesGoal && summary.nutrition.caloriesGoal > 0) {
    parts.push({
      key: "calories",
      label: "Питание",
      value: summary.nutrition.calories / summary.nutrition.caloriesGoal,
    });
  }
  if (summary.water.goalMl && summary.water.goalMl > 0) {
    parts.push({ key: "water", label: "Вода", value: summary.water.ml / summary.water.goalMl });
  }
  if (summary.sleep.goalMinutes && summary.sleep.goalMinutes > 0 && summary.sleep.minutes !== null) {
    parts.push({ key: "sleep", label: "Сон", value: summary.sleep.minutes / summary.sleep.goalMinutes });
  }

  const normalized = parts.map((p) => ({ ...p, value: clamp(p.value, 0, 1) }));
  if (normalized.length === 0) return { value: null, parts: [] };
  const value = normalized.reduce((sum, p) => sum + p.value, 0) / normalized.length;
  return { value, parts: normalized };
}
