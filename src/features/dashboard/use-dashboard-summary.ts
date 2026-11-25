"use client";

import type { DashboardSummary } from "@/types/dashboard";

/**
 * Сводка дня для главного экрана.
 *
 * Источники данных (привычки, питание, вода, сон, тренировки) подключаются
 * через repository layer на следующих этапах. Пока записей нет, сводка честно пустая:
 * никаких выдуманных цифр — только нули и незаданные цели.
 */
const EMPTY_SUMMARY: DashboardSummary = {
  habits: { done: 0, total: 0 },
  nutrition: {
    calories: 0,
    caloriesGoal: null,
    protein: { eaten: 0, goal: null },
    fat: { eaten: 0, goal: null },
    carbs: { eaten: 0, goal: null },
  },
  water: { ml: 0, goalMl: null },
  sleep: { minutes: null, goalMinutes: null },
  lastWorkout: null,
};

export function useDashboardSummary(): DashboardSummary {
  return EMPTY_SUMMARY;
}
