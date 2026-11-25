import {
  exerciseSchema,
  foodSchema,
  habitLogSchema,
  habitSchema,
  healthEntrySchema,
  journalEntrySchema,
  mealEntrySchema,
  recipeSchema,
  workoutProgramSchema,
  workoutSessionSchema,
} from "@/lib/db/schemas";
import { createRepository } from "./create-repository";

/*
 * Репозитории разделов. Специализированные запросы (серии привычек, КБЖУ за день, рекорды…)
 * добавляются в модули разделов на соответствующих этапах поверх этих базовых операций.
 */
export const habitRepository = createRepository("habits", habitSchema, "id");
export const habitLogRepository = createRepository("habitLogs", habitLogSchema, "id");
export const foodRepository = createRepository("foods", foodSchema, "id");
export const recipeRepository = createRepository("recipes", recipeSchema, "id");
export const mealEntryRepository = createRepository("mealEntries", mealEntrySchema, "id");
export const exerciseRepository = createRepository("exercises", exerciseSchema, "id");
export const workoutProgramRepository = createRepository("workoutPrograms", workoutProgramSchema, "id");
export const workoutSessionRepository = createRepository("workoutSessions", workoutSessionSchema, "id");
export const healthEntryRepository = createRepository("healthEntries", healthEntrySchema, "id");
export const journalRepository = createRepository("journalEntries", journalEntrySchema, "date");

export { profileRepository } from "./profile-repository";
export { dashboardRepository } from "./dashboard-repository";
export { backupRepository } from "./backup-repository";
