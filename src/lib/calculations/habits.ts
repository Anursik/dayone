import type { Habit } from "@/lib/db/schemas";

/** Индекс дня недели с понедельника: 0 — пн … 6 — вс. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Запланирована ли привычка на указанный день (по локальному календарю). */
export function isHabitScheduledOn(habit: Pick<Habit, "schedule" | "archived">, date: Date): boolean {
  if (habit.archived) return false;
  return habit.schedule.days.includes(weekdayIndex(date));
}
