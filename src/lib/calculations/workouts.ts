/*
 * Расчёты по тренировкам: тоннаж, расчётный одноповторный максимум, личные рекорды.
 * Учитываются только выполненные подходы (completedAt !== null) завершённых тренировок.
 */

export interface SetLike {
  exerciseId: string;
  weightKg: number | null;
  reps: number;
  completedAt: number | null;
}

export interface SessionLike {
  id: string;
  startedAt: number;
  finishedAt: number | null;
  sets: SetLike[];
}

export function completedSets<T extends SetLike>(sets: T[]): T[] {
  return sets.filter((s) => s.completedAt !== null && s.reps > 0);
}

/**
 * Расчётный одноповторный максимум (1ПМ) по формуле Эпли: вес × (1 + повторы / 30).
 * Для одного повтора — сам вес. Без веса не считается.
 */
export function estimateOneRepMax(weightKg: number | null, reps: number): number | null {
  if (!weightKg || weightKg <= 0 || reps <= 0) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Тоннаж: сумма вес × повторы по выполненным подходам. */
export function volume(sets: SetLike[]): number {
  return completedSets(sets).reduce((s, x) => s + (x.weightKg ?? 0) * x.reps, 0);
}

export function durationMinutes(session: Pick<SessionLike, "startedAt" | "finishedAt">): number | null {
  if (!session.finishedAt) return null;
  return Math.max(0, Math.round((session.finishedAt - session.startedAt) / 60000));
}

export interface ExerciseRecords {
  /** Максимальный вес в выполненном подходе */
  maxWeight: { weightKg: number; reps: number; sessionId: string; at: number } | null;
  /** Лучший расчётный 1ПМ */
  bestOneRepMax: { value: number; weightKg: number; reps: number; sessionId: string; at: number } | null;
  /** Максимум повторений в одном подходе (полезно для упражнений с собственным весом) */
  maxReps: { reps: number; weightKg: number | null; sessionId: string; at: number } | null;
  /** Максимальный тоннаж упражнения за одну тренировку */
  maxSessionVolume: { value: number; sessionId: string; at: number } | null;
}

export const EMPTY_RECORDS: ExerciseRecords = { maxWeight: null, bestOneRepMax: null, maxReps: null, maxSessionVolume: null };

export function exerciseRecords(exerciseId: string, sessions: SessionLike[]): ExerciseRecords {
  const r: ExerciseRecords = { maxWeight: null, bestOneRepMax: null, maxReps: null, maxSessionVolume: null };
  for (const session of sessions) {
    if (!session.finishedAt) continue;
    const sets = completedSets(session.sets).filter((s) => s.exerciseId === exerciseId);
    if (!sets.length) continue;
    const at = session.startedAt;
    for (const s of sets) {
      const w = s.weightKg ?? 0;
      if (w > 0 && (!r.maxWeight || w > r.maxWeight.weightKg || (w === r.maxWeight.weightKg && s.reps > r.maxWeight.reps))) {
        r.maxWeight = { weightKg: w, reps: s.reps, sessionId: session.id, at };
      }
      const e1rm = estimateOneRepMax(s.weightKg, s.reps);
      if (e1rm !== null && (!r.bestOneRepMax || e1rm > r.bestOneRepMax.value)) {
        r.bestOneRepMax = { value: e1rm, weightKg: w, reps: s.reps, sessionId: session.id, at };
      }
      if (!r.maxReps || s.reps > r.maxReps.reps) r.maxReps = { reps: s.reps, weightKg: s.weightKg, sessionId: session.id, at };
    }
    const v = volume(sets);
    if (v > 0 && (!r.maxSessionVolume || v > r.maxSessionVolume.value)) r.maxSessionVolume = { value: v, sessionId: session.id, at };
  }
  return r;
}

export interface NewRecord {
  exerciseId: string;
  kind: "weight" | "oneRepMax" | "reps";
  value: number;
  previous: number | null;
}

/**
 * Новые личные рекорды тренировки относительно всех предыдущих завершённых тренировок.
 * Первая тренировка с упражнением рекордом не считается — сравнивать не с чем.
 */
export function detectNewRecords(session: SessionLike, previousSessions: SessionLike[]): NewRecord[] {
  const earlier = previousSessions.filter((s) => s.id !== session.id && s.finishedAt !== null && s.startedAt < session.startedAt);
  const exerciseIds = [...new Set(completedSets(session.sets).map((s) => s.exerciseId))];
  const found: NewRecord[] = [];
  for (const id of exerciseIds) {
    const before = exerciseRecords(id, earlier);
    if (!before.maxReps) continue; // упражнение выполняется впервые
    const now = exerciseRecords(id, [{ ...session, finishedAt: session.finishedAt ?? Date.now() }]);
    if (now.maxWeight && before.maxWeight && now.maxWeight.weightKg > before.maxWeight.weightKg) {
      found.push({ exerciseId: id, kind: "weight", value: now.maxWeight.weightKg, previous: before.maxWeight.weightKg });
    } else if (now.bestOneRepMax && before.bestOneRepMax && now.bestOneRepMax.value > before.bestOneRepMax.value + 0.01) {
      found.push({ exerciseId: id, kind: "oneRepMax", value: now.bestOneRepMax.value, previous: before.bestOneRepMax.value });
    } else if (!now.maxWeight && !before.maxWeight && now.maxReps && now.maxReps.reps > before.maxReps.reps) {
      found.push({ exerciseId: id, kind: "reps", value: now.maxReps.reps, previous: before.maxReps.reps });
    }
  }
  return found;
}

export interface ProgressPoint {
  at: number;
  sessionId: string;
  /** Максимальный вес за тренировку */
  maxWeight: number | null;
  /** Лучший расчётный 1ПМ за тренировку */
  oneRepMax: number | null;
  /** Максимум повторений за тренировку */
  maxReps: number;
  volume: number;
}

/** Точки графика прогресса упражнения по завершённым тренировкам (в хронологическом порядке). */
export function exerciseProgress(exerciseId: string, sessions: SessionLike[]): ProgressPoint[] {
  return sessions
    .filter((s) => s.finishedAt !== null)
    .sort((a, b) => a.startedAt - b.startedAt)
    .flatMap((s) => {
      const sets = completedSets(s.sets).filter((x) => x.exerciseId === exerciseId);
      if (!sets.length) return [];
      const weights = sets.map((x) => x.weightKg ?? 0).filter((w) => w > 0);
      const e1rms = sets.map((x) => estimateOneRepMax(x.weightKg, x.reps)).filter((v): v is number => v !== null);
      return [
        {
          at: s.startedAt,
          sessionId: s.id,
          maxWeight: weights.length ? Math.max(...weights) : null,
          oneRepMax: e1rms.length ? Math.round(Math.max(...e1rms) * 10) / 10 : null,
          maxReps: Math.max(...sets.map((x) => x.reps)),
          volume: volume(sets),
        },
      ];
    });
}

/** Форматирование таймера: 75 → «1:15», 3725 → «1:02:05». */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
