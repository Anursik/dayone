/*
 * Repository layer: единственная точка доступа UI к локальной базе.
 * Компоненты работают с данными через хуки разделов (src/features/*),
 * которые вызывают эти репозитории; Dexie/IndexedDB напрямую из UI не используются.
 */
export { backupRepository } from "./backup-repository";
export { dashboardRepository } from "./dashboard-repository";
export { habitRepository, type HabitInput } from "./habit-repository";
export { healthRepository } from "./health-repository";
export { EMPTY_JOURNAL, isJournalEmpty, journalRepository, type JournalDraft } from "./journal-repository";
export {
  nutritionRepository,
  type AnyFood,
  type FoodInput,
  type NewMealEntry,
  type RecipeInput,
} from "./nutrition-repository";
export { profileRepository } from "./profile-repository";
export {
  workoutRepository,
  type ProgramInput,
  type ProgramItem,
  type SessionSet,
} from "./workout-repository";
