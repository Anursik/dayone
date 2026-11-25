"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useMemo } from "react";
import {
  bestStreak,
  currentStreak,
  isScheduledOnKey,
  monthRange,
  rangeStats,
  shiftDayKey,
  sumStats,
  weekRange,
  type RangeStats,
} from "@/lib/calculations/habits";
import type { Habit, HabitLog } from "@/lib/db/schemas";
import { toDataError } from "@/lib/db/errors";
import { habitRepository, type HabitInput } from "@/lib/repositories";
import { haptics } from "@/lib/telegram/haptics";
import { toast } from "@/lib/toast";

export interface HabitWithProgress {
  habit: Habit;
  done: Set<string>;
  streak: number;
}

function groupLogs(logs: HabitLog[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const log of logs) {
    let set = map.get(log.habitId);
    if (!set) map.set(log.habitId, (set = new Set()));
    set.add(log.date);
  }
  return map;
}

/** Все привычки с историей. undefined — данные ещё загружаются. */
function useHabitData() {
  return useLiveQuery(async () => {
    const [habits, logs] = await Promise.all([habitRepository.list(), habitRepository.allLogs()]);
    return { habits, logsByHabit: groupLogs(logs) };
  }, []);
}

export interface DayStatus {
  key: string;
  done: number;
  planned: number;
}

export interface HabitsOverview {
  /** Привычки, запланированные (или уже отмеченные) на выбранный день */
  forDay: (HabitWithProgress & { doneOnDay: boolean })[];
  /** Активные привычки, не запланированные на выбранный день */
  notScheduled: HabitWithProgress[];
  activeCount: number;
  archivedCount: number;
  week: RangeStats;
  month: RangeStats;
  weekDays: DayStatus[];
  last7: DayStatus[];
}

function dayStatus(items: HabitWithProgress[], key: string): DayStatus {
  let done = 0;
  let planned = 0;
  for (const { habit, done: set } of items) {
    if (set.has(key)) {
      done++;
      planned++;
    } else if (isScheduledOnKey(habit, key) && new Date(habit.createdAt) <= endOfDay(key)) {
      planned++;
    }
  }
  return { key, done, planned };
}

function endOfDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export function useHabitsOverview(todayKey: string | null, selectedKey: string | null): HabitsOverview | undefined {
  const data = useHabitData();

  return useMemo(() => {
    if (!data || !todayKey || !selectedKey) return undefined;
    const active = data.habits.filter((h) => !h.archived);
    const items: HabitWithProgress[] = active.map((habit) => {
      const done = data.logsByHabit.get(habit.id) ?? new Set<string>();
      return { habit, done, streak: currentStreak(habit, done, todayKey) };
    });

    const forDay: HabitsOverview["forDay"] = [];
    const notScheduled: HabitWithProgress[] = [];
    for (const item of items) {
      const doneOnDay = item.done.has(selectedKey);
      if (doneOnDay || isScheduledOnKey(item.habit, selectedKey)) forDay.push({ ...item, doneOnDay });
      else notScheduled.push(item);
    }

    const [weekFrom, weekTo] = weekRange(todayKey);
    const [monthFrom, monthTo] = monthRange(todayKey);
    const weekDays = Array.from({ length: 7 }, (_, i) => dayStatus(items, shiftDayKey(weekFrom, i)));
    const last7 = Array.from({ length: 7 }, (_, i) => dayStatus(items, shiftDayKey(todayKey, i - 6)));

    return {
      forDay,
      notScheduled,
      activeCount: active.length,
      archivedCount: data.habits.length - active.length,
      week: sumStats(items.map((i) => rangeStats(i.habit, i.done, weekFrom, weekTo, todayKey))),
      month: sumStats(items.map((i) => rangeStats(i.habit, i.done, monthFrom, monthTo, todayKey))),
      weekDays,
      last7,
    };
  }, [data, todayKey, selectedKey]);
}

export function useArchivedHabits(): Habit[] | undefined {
  const data = useHabitData();
  return useMemo(() => data?.habits.filter((h) => h.archived), [data]);
}

export interface HabitDetail {
  habit: Habit;
  done: Set<string>;
  streak: number;
  best: number;
  week: RangeStats;
  month: RangeStats;
  total: number;
}

/** null — привычка не найдена; undefined — загрузка. */
export function useHabitDetail(id: string | null, todayKey: string | null): HabitDetail | null | undefined {
  const data = useLiveQuery(async () => {
    if (!id) return null;
    const [habit, logs] = await Promise.all([habitRepository.get(id), habitRepository.logsForHabit(id)]);
    return habit ? { habit, done: new Set(logs.map((l) => l.date)) } : null;
  }, [id]);

  return useMemo(() => {
    if (data === undefined || !todayKey) return undefined;
    if (data === null) return null;
    const { habit, done } = data;
    const [wf, wt] = weekRange(todayKey);
    const [mf, mt] = monthRange(todayKey);
    return {
      habit,
      done,
      streak: currentStreak(habit, done, todayKey),
      best: bestStreak(habit, done, todayKey),
      week: rangeStats(habit, done, wf, wt, todayKey),
      month: rangeStats(habit, done, mf, mt, todayKey),
      total: done.size,
    };
  }, [data, todayKey]);
}

/* ───────── Действия ───────── */

function reportError(error: unknown) {
  haptics.notify("error");
  toast(toDataError(error).userMessage, "error");
}

export function useHabitActions() {
  const toggle = useCallback(async (habitId: string, dayKey: string) => {
    try {
      const nowDone = await habitRepository.toggleCompletion(habitId, dayKey);
      if (nowDone) haptics.notify("success");
      else haptics.impact("light");
      return nowDone;
    } catch (error) {
      reportError(error);
      return null;
    }
  }, []);

  const create = useCallback(async (input: HabitInput) => {
    try {
      const habit = await habitRepository.create(input);
      haptics.notify("success");
      toast("Привычка создана", "success");
      return habit;
    } catch (error) {
      reportError(error);
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, input: HabitInput) => {
    try {
      const habit = await habitRepository.update(id, input);
      haptics.notify("success");
      toast("Изменения сохранены", "success");
      return habit;
    } catch (error) {
      reportError(error);
      return null;
    }
  }, []);

  const setArchived = useCallback(async (id: string, archived: boolean) => {
    try {
      await habitRepository.setArchived(id, archived);
      haptics.impact("medium");
      toast(archived ? "Привычка в архиве" : "Привычка возвращена", "success");
      return true;
    } catch (error) {
      reportError(error);
      return false;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await habitRepository.remove(id);
      haptics.notify("warning");
      toast("Привычка удалена", "success");
      return true;
    } catch (error) {
      reportError(error);
      return false;
    }
  }, []);

  return { toggle, create, update, setArchived, remove };
}
