import { completedSets } from "@/lib/calculations/workouts";
import { getDb } from "@/lib/db/database";
import { DataError, withDataErrors } from "@/lib/db/errors";
import { createId } from "@/lib/db/ids";
import {
  exerciseSchema,
  workoutProgramSchema,
  workoutSessionSchema,
  type Exercise,
  type WorkoutProgram,
  type WorkoutSession,
} from "@/lib/db/schemas";
import { toDayKey } from "@/lib/date";
import { getBuiltinExercise, isBuiltinExerciseId } from "@/lib/workouts/exercise-library";

export type SessionSet = WorkoutSession["sets"][number];
export type ProgramItem = WorkoutProgram["items"][number];

export interface ProgramInput {
  name: string;
  items: ProgramItem[];
}

export const workoutRepository = {
  /* ───────── Упражнения ───────── */

  listCustomExercises(): Promise<Exercise[]> {
    return withDataErrors(() => getDb().exercises.orderBy("name").toArray());
  },

  async exerciseExists(id: string): Promise<boolean> {
    if (isBuiltinExerciseId(id)) return Boolean(getBuiltinExercise(id));
    return withDataErrors(async () => Boolean(await getDb().exercises.get(id)));
  },

  async saveExercise(input: { name: string; muscleGroup: string | null }, id?: string): Promise<Exercise> {
    return withDataErrors(async () => {
      const db = getDb();
      const current = id ? await db.exercises.get(id) : undefined;
      if (id && !current) throw new DataError("Упражнение не найдено.");
      const exercise = exerciseSchema.parse({
        id: current?.id ?? createId(),
        name: input.name,
        muscleGroup: input.muscleGroup,
        createdAt: current?.createdAt ?? Date.now(),
      });
      await db.exercises.put(exercise);
      return exercise;
    });
  },

  /** Удаление своего упражнения. Запрещено, если оно есть в программах или истории — иначе история потеряет названия. */
  async deleteExercise(id: string): Promise<void> {
    return withDataErrors(async () => {
      const db = getDb();
      const programs = (await db.workoutPrograms.toArray()).filter((p) => p.items.some((i) => i.exerciseId === id));
      if (programs.length) {
        throw new DataError(`Упражнение есть в программах: ${programs.map((p) => `«${p.name}»`).join(", ")}. Сначала уберите его оттуда.`);
      }
      const inHistory = await db.workoutSessions.filter((s) => s.sets.some((x) => x.exerciseId === id)).count();
      if (inHistory) throw new DataError("Упражнение есть в истории тренировок, поэтому его нельзя удалить. Можно переименовать.");
      await db.exercises.delete(id);
    });
  },

  /* ───────── Программы ───────── */

  listPrograms(): Promise<WorkoutProgram[]> {
    return withDataErrors(() => getDb().workoutPrograms.orderBy("updatedAt").reverse().toArray());
  },

  getProgram(id: string): Promise<WorkoutProgram | undefined> {
    return withDataErrors(() => getDb().workoutPrograms.get(id));
  },

  async saveProgram(input: ProgramInput, id?: string): Promise<WorkoutProgram> {
    return withDataErrors(async () => {
      const db = getDb();
      const current = id ? await db.workoutPrograms.get(id) : undefined;
      if (id && !current) throw new DataError("Программа не найдена.");
      for (const item of input.items) {
        if (!(await workoutRepository.exerciseExists(item.exerciseId))) throw new DataError("Одно из упражнений программы не найдено.");
      }
      const now = Date.now();
      const program = workoutProgramSchema.parse({
        id: current?.id ?? createId(),
        name: input.name,
        items: input.items,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
      });
      await db.workoutPrograms.put(program);
      return program;
    });
  },

  deleteProgram(id: string): Promise<void> {
    return withDataErrors(() => getDb().workoutPrograms.delete(id));
  },

  /* ───────── Тренировки ───────── */

  /** Текущая незавершённая тренировка (может быть только одна). */
  async getActiveSession(): Promise<WorkoutSession | undefined> {
    return withDataErrors(() => getDb().workoutSessions.filter((s) => s.finishedAt === null).first());
  },

  listFinishedSessions(): Promise<WorkoutSession[]> {
    return withDataErrors(async () =>
      (await getDb().workoutSessions.orderBy("startedAt").reverse().toArray()).filter((s) => s.finishedAt !== null),
    );
  },

  getSession(id: string): Promise<WorkoutSession | undefined> {
    return withDataErrors(() => getDb().workoutSessions.get(id));
  },

  /** Последние выполненные подходы упражнения — для подсказки «прошлый раз» и автозаполнения веса. */
  async lastSetsFor(exerciseId: string): Promise<SessionSet[]> {
    return withDataErrors(async () => {
      const sessions = await getDb().workoutSessions.orderBy("startedAt").reverse().toArray();
      for (const s of sessions) {
        if (s.finishedAt === null) continue;
        const sets = completedSets(s.sets).filter((x) => x.exerciseId === exerciseId);
        if (sets.length) return sets;
      }
      return [];
    });
  },

  /**
   * Начинает тренировку по программе или пустую.
   * Вес подходов берётся из прошлой тренировки с этим упражнением, иначе — из программы.
   */
  async startSession(program: WorkoutProgram | null): Promise<WorkoutSession> {
    return withDataErrors(async () => {
      const db = getDb();
      return db.transaction("rw", db.workoutSessions, async () => {
        const active = await db.workoutSessions.filter((s) => s.finishedAt === null).first();
        if (active) throw new DataError("Уже есть незавершённая тренировка. Завершите или отмените её.");
        const sets: SessionSet[] = [];
        for (const item of program?.items ?? []) {
          const last = await workoutRepository.lastSetsFor(item.exerciseId);
          for (let i = 0; i < item.sets; i++) {
            const prev = last[i] ?? last[last.length - 1];
            sets.push({
              exerciseId: item.exerciseId,
              weightKg: prev?.weightKg ?? item.weightKg,
              reps: item.reps,
              completedAt: null,
              restSec: item.restSec,
            });
          }
        }
        const now = Date.now();
        const session = workoutSessionSchema.parse({
          id: createId(),
          programId: program?.id ?? null,
          title: program?.name ?? "Тренировка",
          date: toDayKey(new Date(now)),
          startedAt: now,
          finishedAt: null,
          sets,
        });
        await db.workoutSessions.add(session);
        return session;
      });
    });
  },

  /** Сохраняет подходы активной тренировки (вызывается после каждого изменения). */
  async saveSets(id: string, sets: SessionSet[]): Promise<void> {
    return withDataErrors(async () => {
      const db = getDb();
      const current = await db.workoutSessions.get(id);
      if (!current) throw new DataError("Тренировка не найдена.");
      if (current.finishedAt !== null) throw new DataError("Тренировка уже завершена.");
      await db.workoutSessions.put(workoutSessionSchema.parse({ ...current, sets }));
    });
  },

  async renameSession(id: string, title: string): Promise<void> {
    return withDataErrors(async () => {
      const db = getDb();
      const current = await db.workoutSessions.get(id);
      if (!current) throw new DataError("Тренировка не найдена.");
      await db.workoutSessions.put(workoutSessionSchema.parse({ ...current, title }));
    });
  },

  /** Завершает тренировку. Невыполненные подходы не сохраняются в историю. */
  async finishSession(id: string): Promise<WorkoutSession> {
    return withDataErrors(async () => {
      const db = getDb();
      const current = await db.workoutSessions.get(id);
      if (!current) throw new DataError("Тренировка не найдена.");
      const done = completedSets(current.sets);
      if (!done.length) throw new DataError("Нет выполненных подходов. Отметьте хотя бы один подход или отмените тренировку.");
      const finished = workoutSessionSchema.parse({ ...current, sets: done, finishedAt: Math.max(Date.now(), current.startedAt) });
      await db.workoutSessions.put(finished);
      return finished;
    });
  },

  deleteSession(id: string): Promise<void> {
    return withDataErrors(() => getDb().workoutSessions.delete(id));
  },
};
