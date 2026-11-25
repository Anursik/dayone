/*
 * Аналитика за период. Все функции чистые: на вход — записи из базы, на выход — ряды по дням и сводки.
 * Даты — ключи дней "YYYY-MM-DD" в локальном часовом поясе.
 */
type SetLike = { weightKg: number | null; reps: number; completedAt: number | null };
const completedSets = <T extends SetLike>(sets: T[]) => sets.filter((s) => s.completedAt !== null && s.reps > 0);
/** Тоннаж выполненных подходов (та же формула, что в calculations/workouts). */
const volume = (sets: SetLike[]) => completedSets(sets).reduce((s, x) => s + (x.weightKg ?? 0) * x.reps, 0);

type HabitLike = { id: string; name: string; color: string; archived: boolean; createdAt: number; schedule: { days: number[] } };
type HabitLogLike = { habitId: string; date: string };
type MealLike = { date: string; kcal: number; protein: number; fat: number; carbs: number };
type HealthLike = { type: string; date: string; value: number };
type SessionLike = { id: string; date: string; startedAt: number; finishedAt: number | null; sets: { exerciseId: string; weightKg: number | null; reps: number; completedAt: number | null }[] };
type JournalLike = { date: string; mood: number | null; rating: number | null };
type GoalsLike = { caloriesKcal: number | null; waterMl: number | null; sleepMinutes: number | null; stepsTarget: number | null } | null;

export interface AnalyticsInput {
  fromKey: string;
  toKey: string;
  habits: HabitLike[];
  habitLogs: HabitLogLike[];
  meals: MealLike[];
  health: HealthLike[];
  sessions: SessionLike[];
  journal: JournalLike[];
  goals: GoalsLike;
}

export interface DayPoint {
  key: string;
  value: number | null;
}

function keyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dayRange(fromKey: string, toKey: string): string[] {
  const [y, m, d] = fromKey.split("-").map(Number);
  const cur = new Date(y, m - 1, d);
  const out: string[] = [];
  for (let k = keyOf(cur); k <= toKey; cur.setDate(cur.getDate() + 1), k = keyOf(cur)) out.push(k);
  return out;
}

function weekday(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export interface HabitRate {
  id: string;
  name: string;
  color: string;
  done: number;
  planned: number;
  rate: number | null;
}

export interface Analytics {
  days: string[];
  /** Общий прогресс дня (среднее по показателям с целями), 0..1 */
  progress: DayPoint[];
  progressAvg: number | null;
  habits: { daily: DayPoint[]; perHabit: HabitRate[]; done: number; planned: number; rate: number | null };
  nutrition: { daily: DayPoint[]; avgKcal: number | null; loggedDays: number; avgMacros: { protein: number; fat: number; carbs: number } | null; goal: number | null; daysOnTarget: number };
  weight: { daily: DayPoint[]; first: number | null; last: number | null; change: number | null };
  workouts: { daily: DayPoint[]; count: number; minutes: number; volume: number; sets: number };
  activity: { daily: DayPoint[]; totalMinutes: number; avgSteps: number | null; stepsDaily: DayPoint[] };
  sleep: { daily: DayPoint[]; avg: number | null; goal: number | null };
  water: { daily: DayPoint[]; avg: number | null; goal: number | null };
  mood: { daily: DayPoint[]; avgMood: number | null; avgRating: number | null; entries: number };
}

export function computeAnalytics(input: AnalyticsInput, todayKey: string): Analytics {
  const toKey = input.toKey < todayKey ? input.toKey : todayKey;
  const days = dayRange(input.fromKey, toKey);
  const inRange = (k: string) => k >= input.fromKey && k <= toKey;
  const g = input.goals;

  /* Привычки: учётный день = по расписанию (после создания) или с отметкой; сегодня без отметки не считается пропуском */
  const logsByHabit = new Map<string, Set<string>>();
  for (const l of input.habitLogs) {
    if (!logsByHabit.has(l.habitId)) logsByHabit.set(l.habitId, new Set());
    logsByHabit.get(l.habitId)!.add(l.date);
  }
  const active = input.habits.filter((h) => !h.archived);
  const habitDay = new Map(days.map((k) => [k, { done: 0, planned: 0 }]));
  const perHabit: HabitRate[] = active.map((h) => {
    const done = logsByHabit.get(h.id) ?? new Set<string>();
    const created = keyOf(new Date(h.createdAt));
    let d = 0;
    let p = 0;
    for (const k of days) {
      const isDone = done.has(k);
      const due = h.schedule.days.includes(weekday(k)) && k >= created && k !== todayKey;
      if (isDone || due) {
        p++;
        habitDay.get(k)!.planned++;
      }
      if (isDone) {
        d++;
        habitDay.get(k)!.done++;
      }
    }
    return { id: h.id, name: h.name, color: h.color, done: d, planned: p, rate: p ? d / p : null };
  });
  const hDone = perHabit.reduce((s, h) => s + h.done, 0);
  const hPlanned = perHabit.reduce((s, h) => s + h.planned, 0);
  const habitsDaily = days.map((k) => {
    const v = habitDay.get(k)!;
    return { key: k, value: v.planned ? v.done / v.planned : null };
  });

  /* Питание */
  const kcalByDay = new Map<string, number>();
  const macros = { protein: 0, fat: 0, carbs: 0 };
  for (const m of input.meals) {
    if (!inRange(m.date)) continue;
    kcalByDay.set(m.date, (kcalByDay.get(m.date) ?? 0) + m.kcal);
    macros.protein += m.protein;
    macros.fat += m.fat;
    macros.carbs += m.carbs;
  }
  const loggedDays = kcalByDay.size;
  const nutritionDaily = days.map((k) => ({ key: k, value: kcalByDay.get(k) ?? null }));
  const goalKcal = g?.caloriesKcal ?? null;
  const daysOnTarget = goalKcal ? [...kcalByDay.values()].filter((v) => Math.abs(v - goalKcal) <= goalKcal * 0.1).length : 0;

  /* Здоровье */
  const healthOf = (type: string) => input.health.filter((e) => e.type === type && inRange(e.date));
  const sumByDay = (type: string) => {
    const map = new Map<string, number>();
    for (const e of healthOf(type)) map.set(e.date, (map.get(e.date) ?? 0) + e.value);
    return map;
  };
  const lastByDay = (type: string) => {
    const map = new Map<string, number>();
    for (const e of healthOf(type)) map.set(e.date, e.value);
    return map;
  };
  const weightMap = lastByDay("weight");
  const weightDaily = days.map((k) => ({ key: k, value: weightMap.get(k) ?? null }));
  const weights = weightDaily.filter((d) => d.value !== null) as { key: string; value: number }[];
  const waterMap = sumByDay("water");
  const sleepMap = lastByDay("sleep");
  const stepsMap = lastByDay("steps");
  const activityMap = sumByDay("activity");

  /* Тренировки */
  const finished = input.sessions.filter((s) => s.finishedAt !== null && inRange(s.date));
  const volByDay = new Map<string, number>();
  for (const s of finished) volByDay.set(s.date, (volByDay.get(s.date) ?? 0) + volume(s.sets));

  /* Дневник */
  const journal = input.journal.filter((j) => inRange(j.date));
  const moodMap = new Map(journal.filter((j) => j.mood !== null).map((j) => [j.date, j.mood as number]));

  /* Общий прогресс: по каждому дню среднее выполнение целей (привычки, калории, вода, сон) */
  const progress = days.map((k) => {
    const parts: number[] = [];
    const h = habitDay.get(k)!;
    if (h.planned) parts.push(h.done / h.planned);
    if (goalKcal && kcalByDay.has(k)) parts.push(clamp01(kcalByDay.get(k)! / goalKcal));
    if (g?.waterMl && waterMap.has(k)) parts.push(clamp01(waterMap.get(k)! / g.waterMl));
    if (g?.sleepMinutes && sleepMap.has(k)) parts.push(clamp01(sleepMap.get(k)! / g.sleepMinutes));
    return { key: k, value: parts.length ? avg(parts) : null };
  });

  return {
    days,
    progress,
    progressAvg: avg(progress.filter((p) => p.value !== null).map((p) => p.value as number)),
    habits: { daily: habitsDaily, perHabit: perHabit.sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1)), done: hDone, planned: hPlanned, rate: hPlanned ? hDone / hPlanned : null },
    nutrition: {
      daily: nutritionDaily,
      avgKcal: avg([...kcalByDay.values()]),
      loggedDays,
      avgMacros: loggedDays ? { protein: macros.protein / loggedDays, fat: macros.fat / loggedDays, carbs: macros.carbs / loggedDays } : null,
      goal: goalKcal,
      daysOnTarget,
    },
    weight: {
      daily: weightDaily,
      first: weights[0]?.value ?? null,
      last: weights.at(-1)?.value ?? null,
      change: weights.length >= 2 ? Math.round((weights.at(-1)!.value - weights[0].value) * 10) / 10 : null,
    },
    workouts: {
      daily: days.map((k) => ({ key: k, value: volByDay.get(k) ?? null })),
      count: finished.length,
      minutes: finished.reduce((s, x) => s + Math.round(((x.finishedAt ?? x.startedAt) - x.startedAt) / 60000), 0),
      volume: finished.reduce((s, x) => s + volume(x.sets), 0),
      sets: finished.reduce((s, x) => s + completedSets(x.sets).length, 0),
    },
    activity: {
      daily: days.map((k) => ({ key: k, value: activityMap.get(k) ?? null })),
      totalMinutes: [...activityMap.values()].reduce((a, b) => a + b, 0),
      avgSteps: avg([...stepsMap.values()]),
      stepsDaily: days.map((k) => ({ key: k, value: stepsMap.get(k) ?? null })),
    },
    sleep: { daily: days.map((k) => ({ key: k, value: sleepMap.get(k) ?? null })), avg: avg([...sleepMap.values()]), goal: g?.sleepMinutes ?? null },
    water: { daily: days.map((k) => ({ key: k, value: waterMap.get(k) ?? null })), avg: avg([...waterMap.values()]), goal: g?.waterMl ?? null },
    mood: {
      daily: days.map((k) => ({ key: k, value: moodMap.get(k) ?? null })),
      avgMood: avg([...moodMap.values()]),
      avgRating: avg(journal.filter((j) => j.rating !== null).map((j) => j.rating as number)),
      entries: journal.length,
    },
  };
}
