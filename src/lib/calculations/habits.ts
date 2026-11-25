import type { Habit } from "@/lib/db/schemas";

/*
 * Расчёты по привычкам. Все даты — ключи дней "YYYY-MM-DD" в локальном часовом поясе,
 * арифметика дней выполняется через Date(год, месяц, день), поэтому переход
 * на летнее/зимнее время не ломает подсчёт.
 */

type HabitLike = Pick<Habit, "schedule" | "archived" | "createdAt">;

function keyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shift(key: string, days: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return keyOf(d);
}

/** Индекс дня недели с понедельника: 0 — пн … 6 — вс. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function isScheduledOnKey(habit: Pick<Habit, "schedule">, dayKey: string): boolean {
  return habit.schedule.days.includes(weekdayIndex(parseKey(dayKey)));
}

/** Запланирована ли (не архивная) привычка на указанный день. */
export function isHabitScheduledOn(habit: Pick<Habit, "schedule" | "archived">, date: Date): boolean {
  if (habit.archived) return false;
  return habit.schedule.days.includes(weekdayIndex(date));
}

/** Первый день, с которого привычка учитывается: день создания или самая ранняя отметка. */
export function habitStartKey(habit: Pick<Habit, "createdAt">, doneKeys: Iterable<string>): string {
  let start = keyOf(new Date(habit.createdAt));
  for (const k of doneKeys) if (k < start) start = k;
  return start;
}

/**
 * Текущая серия: подряд идущие выполненные «учётные» дни (по расписанию или с отметкой),
 * считая назад от сегодня. Невыполненный сегодняшний день серию не прерывает —
 * день ещё не закончился. Дни вне расписания пропускаются.
 */
export function currentStreak(habit: HabitLike, done: Set<string>, todayKey: string): number {
  const start = habitStartKey(habit, done);
  let streak = 0;
  let day = todayKey;
  while (day >= start) {
    const scheduled = isScheduledOnKey(habit, day);
    if (done.has(day)) streak++;
    else if (scheduled && day !== todayKey) break;
    day = shift(day, -1);
  }
  return streak;
}

/** Лучшая серия за всю историю. */
export function bestStreak(habit: HabitLike, done: Set<string>, todayKey: string): number {
  const start = habitStartKey(habit, done);
  let best = 0;
  let run = 0;
  for (let day = start; day <= todayKey; day = shift(day, 1)) {
    if (done.has(day)) {
      run++;
      if (run > best) best = run;
    } else if (isScheduledOnKey(habit, day) && day !== todayKey) {
      run = 0;
    }
  }
  return best;
}

export interface RangeStats {
  /** Учётных дней (по расписанию или с отметкой) в периоде, начиная с создания привычки и не позже сегодня */
  planned: number;
  done: number;
  /** 0..1 или null, если в периоде нет учётных дней */
  rate: number | null;
}

/**
 * Выполнение за период [fromKey, toKey]. Будущие дни не учитываются.
 * Пропуском считается только неотмеченный день по расписанию ПОСЛЕ создания привычки:
 * отметки задним числом (до создания) добавляют выполненные дни, но не порождают «пропуски».
 * Сегодняшний день учитывается только если уже отмечен — иначе он ещё не «провален».
 */
export function rangeStats(habit: HabitLike, done: Set<string>, fromKey: string, toKey: string, todayKey: string): RangeStats {
  const start = habitStartKey(habit, done);
  const createdKey = keyOf(new Date(habit.createdAt));
  const from = fromKey > start ? fromKey : start;
  const to = toKey < todayKey ? toKey : todayKey;
  let planned = 0;
  let doneCount = 0;
  for (let day = from; day <= to; day = shift(day, 1)) {
    const isDone = done.has(day);
    const scheduled = isScheduledOnKey(habit, day);
    if (isDone) {
      planned++;
      doneCount++;
    } else if (scheduled && day !== todayKey && day >= createdKey) {
      planned++;
    }
  }
  return { planned, done: doneCount, rate: planned > 0 ? doneCount / planned : null };
}

export function sumStats(items: RangeStats[]): RangeStats {
  const planned = items.reduce((s, i) => s + i.planned, 0);
  const done = items.reduce((s, i) => s + i.done, 0);
  return { planned, done, rate: planned > 0 ? done / planned : null };
}

/** Границы текущей недели (пн–вс) и месяца для ключа дня. */
export function weekRange(todayKey: string): [string, string] {
  const d = parseKey(todayKey);
  const monday = shift(todayKey, -weekdayIndex(d));
  return [monday, shift(monday, 6)];
}

export function monthRange(todayKey: string): [string, string] {
  const d = parseKey(todayKey);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return [keyOf(first), keyOf(last)];
}

export { shift as shiftDayKey };

/* ───────── Расписание ───────── */

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS = [0, 1, 2, 3, 4];
export const WEEKENDS = [5, 6];

const DAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function describeSchedule(days: number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return "Каждый день";
  if (sorted.join() === WEEKDAYS.join()) return "По будням";
  if (sorted.join() === WEEKENDS.join()) return "По выходным";
  return sorted.map((d) => DAY_SHORT[d]).join(", ");
}

export { DAY_SHORT };
