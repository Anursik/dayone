import Dexie, { type EntityTable } from "dexie";
import { toDataError } from "./errors";
import type {
  Exercise,
  Food,
  Habit,
  HabitLog,
  HealthEntry,
  JournalEntry,
  MealEntry,
  MetaRecord,
  Profile,
  Recipe,
  WorkoutProgram,
  WorkoutSession,
} from "./schemas";

/**
 * Локальная база DAYONE (IndexedDB через Dexie).
 *
 * МИГРАЦИИ: при изменении структуры НЕ меняйте существующие версии —
 * добавляйте новую `this.version(N).stores({...}).upgrade(tx => ...)`
 * и увеличивайте DB_SCHEMA_VERSION. Dexie сам последовательно применит миграции
 * на устройствах, где установлена старая версия.
 */
export const DB_SCHEMA_VERSION = 1;

export class DayoneDatabase extends Dexie {
  profile!: EntityTable<Profile, "id">;
  habits!: EntityTable<Habit, "id">;
  habitLogs!: EntityTable<HabitLog, "id">;
  foods!: EntityTable<Food, "id">;
  recipes!: EntityTable<Recipe, "id">;
  mealEntries!: EntityTable<MealEntry, "id">;
  exercises!: EntityTable<Exercise, "id">;
  workoutPrograms!: EntityTable<WorkoutProgram, "id">;
  workoutSessions!: EntityTable<WorkoutSession, "id">;
  healthEntries!: EntityTable<HealthEntry, "id">;
  journalEntries!: EntityTable<JournalEntry, "date">;
  meta!: EntityTable<MetaRecord, "key">;

  constructor(name: string) {
    super(name);

    // Версия 1 — исходная структура
    this.version(1).stores({
      profile: "id",
      habits: "id, order",
      habitLogs: "id, &[habitId+date], habitId, date",
      foods: "id, name, source",
      recipes: "id, name",
      mealEntries: "id, date, [date+meal]",
      exercises: "id, name",
      workoutPrograms: "id, updatedAt",
      workoutSessions: "id, date, startedAt, programId",
      healthEntries: "id, [type+date], type, date",
      journalEntries: "date",
      meta: "key",
    });
  }
}

/* ───────── Подключение ───────── */

let instance: DayoneDatabase | null = null;

/**
 * Имя базы зависит от пользователя Telegram: если на одном устройстве в Telegram
 * входят разные аккаунты, у каждого своя отдельная база и чужие записи не видны.
 */
export function getDatabaseName(telegramUserId: number | null): string {
  return telegramUserId ? `dayone-tg-${telegramUserId}` : "dayone-local";
}

export async function openDatabase(name: string): Promise<DayoneDatabase> {
  if (instance?.name === name && instance.isOpen()) return instance;
  instance?.close();

  if (typeof indexedDB === "undefined") {
    throw toDataError({ name: "MissingAPIError" });
  }

  const db = new DayoneDatabase(name);
  // Если база обновилась в другой вкладке, закрываем старое соединение и перезагружаемся
  db.on("versionchange", () => {
    db.close();
    window.location.reload();
    return false;
  });

  try {
    await db.open();
  } catch (error) {
    db.close();
    throw toDataError(error);
  }

  instance = db;
  return db;
}

/** Текущее подключение. Используется только репозиториями. */
export function getDb(): DayoneDatabase {
  if (!instance) throw toDataError({ name: "DatabaseClosedError" });
  return instance;
}

export async function deleteCurrentDatabase(): Promise<void> {
  if (!instance) return;
  const name = instance.name;
  instance.close();
  instance = null;
  await Dexie.delete(name);
}

/** Просит браузер не очищать хранилище автоматически. */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}
