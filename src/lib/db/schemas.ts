import { z } from "zod";

/**
 * Единые схемы данных DAYONE.
 * Используются для проверки каждой записи перед сохранением и для проверки импортируемых резервных копий.
 * Время хранится как Unix-время в миллисекундах, календарные дни — как ключ "YYYY-MM-DD" в локальном поясе.
 */

export const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ожидается дата в формате ГГГГ-ММ-ДД");
export const idSchema = z.string().min(1).max(64);
export const timestampSchema = z.number().int().nonnegative();

const nonNegative = z.number().finite().nonnegative();
const nullableInt = (min: number, max: number) => z.number().int().min(min).max(max).nullable();
const nullableNum = (min: number, max: number) => z.number().finite().min(min).max(max).nullable();

/* ───────── Профиль ───────── */

export const goalsSchema = z.object({
  caloriesKcal: nullableInt(0, 10000),
  proteinG: nullableInt(0, 1000),
  fatG: nullableInt(0, 1000),
  carbsG: nullableInt(0, 2000),
  waterMl: nullableInt(0, 10000),
  sleepMinutes: nullableInt(0, 1440),
  stepsTarget: nullableInt(0, 100000),
  targetWeightKg: nullableNum(20, 400),
});

export const PROFILE_ID = "me";

export const profileSchema = z.object({
  id: z.literal(PROFILE_ID),
  name: z.string().trim().max(60),
  age: nullableInt(5, 120),
  heightCm: nullableNum(50, 260),
  weightKg: nullableNum(20, 400),
  goals: goalsSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

/* ───────── Привычки ───────── */

export const habitScheduleSchema = z.object({
  /** Дни недели: 0 — понедельник … 6 — воскресенье */
  days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
});

export const habitSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(60),
  icon: z.string().min(1).max(40),
  color: z.string().min(1).max(40),
  schedule: habitScheduleSchema,
  archived: z.boolean(),
  order: z.number().int(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const habitLogSchema = z.object({
  id: idSchema,
  habitId: idSchema,
  date: dayKeySchema,
  completedAt: timestampSchema,
});

/* ───────── Питание ───────── */

export const foodSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1).max(80),
    /** Значения на 100 г */
    kcal: nonNegative.max(1000),
    protein: nonNegative.max(100),
    fat: nonNegative.max(100),
    carbs: nonNegative.max(100),
    source: z.enum(["builtin", "custom"]),
    createdAt: timestampSchema,
  })
  .refine((f) => f.protein + f.fat + f.carbs <= 100.5, {
    message: "Сумма белков, жиров и углеводов не может превышать 100 г на 100 г продукта",
    path: ["carbs"],
  });

export const recipeSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(80),
  items: z.array(z.object({ foodId: idSchema, grams: z.number().positive().max(10000) })).min(1),
  /** Вес готового блюда (выход), г. null — равен сумме ингредиентов */
  yieldGrams: z.number().positive().max(100000).nullable().default(null),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const mealEntrySchema = z.object({
  id: idSchema,
  date: dayKeySchema,
  meal: mealTypeSchema,
  title: z.string().trim().min(1).max(80),
  grams: z.number().positive().max(10000),
  /** Итог для порции (уже пересчитан с учётом граммовки) */
  kcal: nonNegative,
  protein: nonNegative,
  fat: nonNegative,
  carbs: nonNegative,
  foodId: idSchema.nullable(),
  recipeId: idSchema.nullable(),
  createdAt: timestampSchema,
});

/* ───────── Тренировки ───────── */

export const exerciseSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(80),
  muscleGroup: z.string().max(40).nullable(),
  createdAt: timestampSchema,
});

export const workoutProgramSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(80),
  items: z.array(
    z.object({
      exerciseId: idSchema,
      sets: z.number().int().min(1).max(50),
      reps: z.number().int().min(1).max(1000),
      weightKg: nullableNum(0, 1000),
      restSec: z.number().int().min(0).max(3600),
    }),
  ),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const workoutSessionSchema = z.object({
  id: idSchema,
  programId: idSchema.nullable(),
  title: z.string().trim().min(1).max(80),
  date: dayKeySchema,
  startedAt: timestampSchema,
  finishedAt: timestampSchema.nullable(),
  sets: z.array(
    z.object({
      exerciseId: idSchema,
      weightKg: nullableNum(0, 1000),
      reps: z.number().int().min(0).max(1000),
      completedAt: timestampSchema.nullable(),
    }),
  ),
});

/* ───────── Здоровье ───────── */

export const healthTypeSchema = z.enum(["weight", "water", "sleep", "steps", "activity", "measurement"]);

export const healthEntrySchema = z.object({
  id: idSchema,
  type: healthTypeSchema,
  date: dayKeySchema,
  /** weight — кг, water — мл, sleep — минуты, steps — шаги, activity — минуты, measurement — см */
  value: z.number().finite().nonnegative(),
  /** Дополнительные поля, например часть тела для замеров */
  details: z.record(z.string(), z.union([z.string(), z.number()])).nullable(),
  createdAt: timestampSchema,
});

/* ───────── Дневник ───────── */

export const journalEntrySchema = z.object({
  date: dayKeySchema,
  mood: nullableInt(1, 5),
  rating: nullableInt(1, 10),
  wins: z.string().max(5000),
  fails: z.string().max(5000),
  improve: z.string().max(5000),
  notes: z.string().max(20000),
  updatedAt: timestampSchema,
});

/* ───────── Типы ───────── */

export type Goals = z.infer<typeof goalsSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Habit = z.infer<typeof habitSchema>;
export type HabitLog = z.infer<typeof habitLogSchema>;
export type Food = z.infer<typeof foodSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type MealType = z.infer<typeof mealTypeSchema>;
export type MealEntry = z.infer<typeof mealEntrySchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type WorkoutProgram = z.infer<typeof workoutProgramSchema>;
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
export type HealthType = z.infer<typeof healthTypeSchema>;
export type HealthEntry = z.infer<typeof healthEntrySchema>;
export type JournalEntry = z.infer<typeof journalEntrySchema>;

export interface MetaRecord {
  key: string;
  value: unknown;
}

/** Таблицы, которые попадают в резервную копию, и схемы их записей. */
export const TABLE_SCHEMAS = {
  profile: profileSchema,
  habits: habitSchema,
  habitLogs: habitLogSchema,
  foods: foodSchema,
  recipes: recipeSchema,
  mealEntries: mealEntrySchema,
  exercises: exerciseSchema,
  workoutPrograms: workoutProgramSchema,
  workoutSessions: workoutSessionSchema,
  healthEntries: healthEntrySchema,
  journalEntries: journalEntrySchema,
} as const;

export type DataTableName = keyof typeof TABLE_SCHEMAS;
export const DATA_TABLES = Object.keys(TABLE_SCHEMAS) as DataTableName[];

export const TABLE_LABELS: Record<DataTableName, string> = {
  profile: "Профиль",
  habits: "Привычки",
  habitLogs: "Отметки привычек",
  foods: "Продукты",
  recipes: "Блюда",
  mealEntries: "Приёмы пищи",
  exercises: "Упражнения",
  workoutPrograms: "Программы тренировок",
  workoutSessions: "Тренировки",
  healthEntries: "Показатели здоровья",
  journalEntries: "Записи дневника",
};
