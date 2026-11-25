import { getDb } from "@/lib/db/database";
import { DataError, withDataErrors } from "@/lib/db/errors";
import { createId } from "@/lib/db/ids";
import { habitLogSchema, habitSchema, type Habit, type HabitLog } from "@/lib/db/schemas";
import { toDayKey } from "@/lib/date";

export interface HabitInput {
  name: string;
  icon: string;
  color: string;
  days: number[];
}

function normalizeDays(days: number[]): number[] {
  return [...new Set(days)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
}

export const habitRepository = {
  /** Все привычки в пользовательском порядке. */
  async list(): Promise<Habit[]> {
    return withDataErrors(() => getDb().habits.orderBy("order").toArray());
  },

  get(id: string): Promise<Habit | undefined> {
    return withDataErrors(() => getDb().habits.get(id));
  },

  async create(input: HabitInput): Promise<Habit> {
    return withDataErrors(async () => {
      const db = getDb();
      const last = await db.habits.orderBy("order").last();
      const now = Date.now();
      const habit = habitSchema.parse({
        id: createId(),
        name: input.name,
        icon: input.icon,
        color: input.color,
        schedule: { days: normalizeDays(input.days) },
        archived: false,
        order: (last?.order ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      });
      await db.habits.add(habit);
      return habit;
    });
  },

  async update(id: string, input: HabitInput): Promise<Habit> {
    return withDataErrors(async () => {
      const db = getDb();
      const current = await db.habits.get(id);
      if (!current) throw new DataError("Привычка не найдена — возможно, она уже удалена.");
      const next = habitSchema.parse({
        ...current,
        name: input.name,
        icon: input.icon,
        color: input.color,
        schedule: { days: normalizeDays(input.days) },
        updatedAt: Date.now(),
      });
      await db.habits.put(next);
      return next;
    });
  },

  async setArchived(id: string, archived: boolean): Promise<void> {
    return withDataErrors(async () => {
      const updated = await getDb().habits.update(id, { archived, updatedAt: Date.now() });
      if (!updated) throw new DataError("Привычка не найдена.");
    });
  },

  /** Удаляет привычку вместе со всей историей выполнения. */
  async remove(id: string): Promise<void> {
    return withDataErrors(async () => {
      const db = getDb();
      await db.transaction("rw", db.habits, db.habitLogs, async () => {
        await db.habitLogs.where("habitId").equals(id).delete();
        await db.habits.delete(id);
      });
    });
  },

  /**
   * Отметить / снять отметку выполнения за день.
   * Выполняется атомарно: повторная отметка за тот же день невозможна
   * (проверка в транзакции + уникальный индекс [habitId+date] в базе).
   * Будущие дни отмечать нельзя.
   */
  async toggleCompletion(habitId: string, dayKey: string): Promise<boolean> {
    return withDataErrors(async () => {
      if (dayKey > toDayKey(new Date())) throw new DataError("Нельзя отметить привычку за будущий день.");
      const db = getDb();
      return db.transaction("rw", db.habits, db.habitLogs, async () => {
        const habit = await db.habits.get(habitId);
        if (!habit) throw new DataError("Привычка не найдена.");
        const existing = await db.habitLogs.where("[habitId+date]").equals([habitId, dayKey]).first();
        if (existing) {
          await db.habitLogs.delete(existing.id);
          return false;
        }
        await db.habitLogs.add(
          habitLogSchema.parse({ id: createId(), habitId, date: dayKey, completedAt: Date.now() }),
        );
        return true;
      });
    });
  },

  logsForHabit(habitId: string): Promise<HabitLog[]> {
    return withDataErrors(() => getDb().habitLogs.where("habitId").equals(habitId).toArray());
  },

  logsBetween(fromKey: string, toKey: string): Promise<HabitLog[]> {
    return withDataErrors(() => getDb().habitLogs.where("date").between(fromKey, toKey, true, true).toArray());
  },

  allLogs(): Promise<HabitLog[]> {
    return withDataErrors(() => getDb().habitLogs.toArray());
  },
};
