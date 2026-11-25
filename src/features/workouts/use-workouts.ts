"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useMemo } from "react";
import {
  completedSets,
  detectNewRecords,
  durationMinutes,
  exerciseProgress,
  exerciseRecords,
  volume,
  type NewRecord,
} from "@/lib/calculations/workouts";
import { toDataError } from "@/lib/db/errors";
import type { Exercise, WorkoutProgram, WorkoutSession } from "@/lib/db/schemas";
import { searchByName } from "@/lib/nutrition/search";
import { workoutRepository, type ProgramInput, type SessionSet } from "@/lib/repositories";
import { haptics } from "@/lib/telegram/haptics";
import { toast } from "@/lib/toast";
import { BUILTIN_EXERCISES, MUSCLE_GROUPS, getBuiltinExercise } from "@/lib/workouts/exercise-library";

export interface CatalogExercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  source: "builtin" | "custom";
}

export interface ExerciseCatalog {
  all: CatalogExercise[];
  custom: Exercise[];
  name: (id: string) => string;
  get: (id: string) => CatalogExercise | undefined;
  search: (query: string) => CatalogExercise[];
  groups: [string, CatalogExercise[]][];
}

const BUILTIN: CatalogExercise[] = BUILTIN_EXERCISES.map((e) => ({ ...e }));

export function useExerciseCatalog(): ExerciseCatalog | undefined {
  const custom = useLiveQuery(() => workoutRepository.listCustomExercises(), []);
  return useMemo(() => {
    if (!custom) return undefined;
    const customItems: CatalogExercise[] = custom.map((e) => ({ id: e.id, name: e.name, muscleGroup: e.muscleGroup, source: "custom" }));
    const all = [...customItems, ...BUILTIN];
    const byId = new Map(all.map((e) => [e.id, e]));
    const groups = new Map<string, CatalogExercise[]>();
    if (customItems.length) groups.set("Мои упражнения", customItems);
    for (const g of MUSCLE_GROUPS) groups.set(g, BUILTIN.filter((e) => e.muscleGroup === g));
    return {
      all,
      custom,
      get: (id) => byId.get(id),
      name: (id) => byId.get(id)?.name ?? getBuiltinExercise(id)?.name ?? "Удалённое упражнение",
      search: (q) => searchByName(all, q, 40),
      groups: [...groups.entries()],
    };
  }, [custom]);
}

/* ───────── Обзор ───────── */

export interface SessionSummary {
  session: WorkoutSession;
  minutes: number | null;
  sets: number;
  volume: number;
  exercises: number;
}

export function summarize(session: WorkoutSession): SessionSummary {
  const done = completedSets(session.sets);
  return {
    session,
    minutes: durationMinutes(session),
    sets: done.length,
    volume: volume(done),
    exercises: new Set(done.map((s) => s.exerciseId)).size,
  };
}

export function useWorkoutsOverview(weekStartMs: number | null) {
  const data = useLiveQuery(async () => {
    const [active, programs, finished] = await Promise.all([
      workoutRepository.getActiveSession(),
      workoutRepository.listPrograms(),
      workoutRepository.listFinishedSessions(),
    ]);
    return { active: active ?? null, programs, finished };
  }, []);

  return useMemo(() => {
    if (!data || weekStartMs === null) return undefined;
    const history = data.finished.map(summarize);
    const thisWeek = history.filter((h) => h.session.startedAt >= weekStartMs);
    return {
      active: data.active,
      programs: data.programs,
      history,
      week: {
        count: thisWeek.length,
        minutes: thisWeek.reduce((s, h) => s + (h.minutes ?? 0), 0),
        volume: thisWeek.reduce((s, h) => s + h.volume, 0),
      },
    };
  }, [data, weekStartMs]);
}

/* ───────── Активная тренировка ───────── */

export function useActiveSession() {
  return useLiveQuery(async () => {
    const [active, finished] = await Promise.all([workoutRepository.getActiveSession(), workoutRepository.listFinishedSessions()]);
    if (!active) return { active: null, lastByExercise: new Map<string, SessionSet[]>(), finished };
    // «Прошлый раз» для каждого упражнения — подходы из последней завершённой тренировки, где оно было.
    // finished отсортированы от новых к старым, поэтому первая найденная тренировка — последняя.
    const lastByExercise = new Map<string, SessionSet[]>();
    for (const s of finished) {
      const done = completedSets(s.sets);
      for (const exerciseId of new Set(done.map((x) => x.exerciseId))) {
        if (!lastByExercise.has(exerciseId)) lastByExercise.set(exerciseId, done.filter((x) => x.exerciseId === exerciseId));
      }
    }
    return { active, lastByExercise, finished };
  }, []);
}

/* ───────── Детали ───────── */

export function useSessionDetail(id: string | null) {
  return useLiveQuery(async () => {
    if (!id) return null;
    const [session, finished] = await Promise.all([workoutRepository.getSession(id), workoutRepository.listFinishedSessions()]);
    if (!session) return null;
    return { summary: summarize(session), records: detectNewRecords(session, finished) };
  }, [id]);
}

export function useExerciseDetail(id: string | null) {
  const sessions = useLiveQuery(() => workoutRepository.listFinishedSessions(), []);
  return useMemo(() => {
    if (!id || !sessions) return undefined;
    const withExercise = sessions.filter((s) => s.sets.some((x) => x.exerciseId === id));
    return {
      records: exerciseRecords(id, withExercise),
      progress: exerciseProgress(id, withExercise),
      history: withExercise.map((s) => ({ session: s, sets: completedSets(s.sets).filter((x) => x.exerciseId === id) })),
    };
  }, [id, sessions]);
}

export function useProgram(id: string | null): WorkoutProgram | null | undefined {
  return useLiveQuery(async () => (id ? ((await workoutRepository.getProgram(id)) ?? null) : null), [id]);
}

/* ───────── Действия ───────── */

function fail(error: unknown) {
  haptics.notify("error");
  toast(toDataError(error).userMessage, "error");
}

async function run<T>(fn: () => Promise<T>, success?: string, feedback: "success" | "none" = "success"): Promise<T | null> {
  try {
    const r = await fn();
    if (feedback === "success") haptics.notify("success");
    if (success) toast(success, "success");
    return r;
  } catch (error) {
    fail(error);
    return null;
  }
}

export function useWorkoutActions() {
  return {
    saveExercise: useCallback((input: { name: string; muscleGroup: string | null }, id?: string) => run(() => workoutRepository.saveExercise(input, id), id ? "Упражнение обновлено" : "Упражнение добавлено"), []),
    deleteExercise: useCallback((id: string) => run(() => workoutRepository.deleteExercise(id).then(() => true), "Упражнение удалено"), []),
    saveProgram: useCallback((input: ProgramInput, id?: string) => run(() => workoutRepository.saveProgram(input, id), id ? "Программа сохранена" : "Программа создана"), []),
    deleteProgram: useCallback((id: string) => run(() => workoutRepository.deleteProgram(id).then(() => true), "Программа удалена"), []),
    start: useCallback((program: WorkoutProgram | null) => run(() => workoutRepository.startSession(program), undefined), []),
    saveSets: useCallback(async (id: string, sets: SessionSet[]) => {
      try {
        await workoutRepository.saveSets(id, sets);
      } catch (error) {
        fail(error);
        throw error;
      }
    }, []),
    rename: useCallback((id: string, title: string) => run(() => workoutRepository.renameSession(id, title), undefined, "none"), []),
    finish: useCallback(async (id: string): Promise<{ session: WorkoutSession; records: NewRecord[] } | null> => {
      try {
        const finished = await workoutRepository.listFinishedSessions();
        const session = await workoutRepository.finishSession(id);
        haptics.notify("success");
        return { session, records: detectNewRecords(session, finished) };
      } catch (error) {
        fail(error);
        return null;
      }
    }, []),
    deleteSession: useCallback((id: string, message = "Тренировка удалена") => run(() => workoutRepository.deleteSession(id).then(() => true), message), []),
  };
}
