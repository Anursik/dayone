"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useMemo } from "react";
import { toDataError } from "@/lib/db/errors";
import type { Goals, HealthEntry, HealthType } from "@/lib/db/schemas";
import { shiftDayKey } from "@/lib/date";
import { METRICS } from "@/lib/health/metrics";
import { healthRepository, profileRepository } from "@/lib/repositories";
import { haptics } from "@/lib/telegram/haptics";
import { toast } from "@/lib/toast";

export interface HealthDay {
  entries: HealthEntry[];
  water: number;
  sleep: number | null;
  steps: number | null;
  activity: number;
  activityEntries: HealthEntry[];
  weight: number | null;
  measurements: HealthEntry[];
  goals: Goals | null;
  latestWeight: { value: number; date: string } | null;
}

export function useHealthDay(dayKey: string | null): HealthDay | undefined {
  const data = useLiveQuery(async () => {
    if (!dayKey) return undefined;
    const [entries, profile, weights] = await Promise.all([
      healthRepository.entriesForDay(dayKey),
      profileRepository.get(),
      healthRepository.history("weight", 1),
    ]);
    return { dayKey, entries, goals: profile?.goals ?? null, latestWeight: weights[0] ? { value: weights[0].value, date: weights[0].date } : null };
  }, [dayKey]);

  return useMemo(() => {
    // Данные другого дня (ещё не пришёл ответ на новый запрос) не отдаём — формы не должны заполниться чужим днём
    if (!data || data.dayKey !== dayKey) return undefined;
    const of = (t: HealthType) => data.entries.filter((e) => e.type === t);
    const sum = (t: HealthType) => of(t).reduce((s, e) => s + e.value, 0);
    const single = (t: HealthType) => of(t).at(-1)?.value ?? null;
    return {
      entries: data.entries,
      water: sum("water"),
      sleep: single("sleep"),
      steps: single("steps"),
      activity: sum("activity"),
      activityEntries: of("activity"),
      weight: single("weight"),
      measurements: of("measurement"),
      goals: data.goals,
      latestWeight: data.latestWeight,
    };
  }, [data, dayKey]);
}

export interface ChartDay {
  key: string;
  value: number | null;
}

/** История показателя: записи и значения по дням за последние `days` дней. */
export function useMetricHistory(type: HealthType, todayKey: string | null, part: string | null, days = 30) {
  const data = useLiveQuery(async () => {
    const [history, profile] = await Promise.all([healthRepository.history(type), profileRepository.get()]);
    return { history, goals: profile?.goals ?? null };
  }, [type]);

  return useMemo(() => {
    if (!data || !todayKey) return undefined;
    const relevant = type === "measurement" && part ? data.history.filter((e) => e.details?.part === part) : data.history;
    const from = shiftDayKey(todayKey, -(days - 1));
    const byDay = new Map<string, number>();
    for (const e of relevant) {
      if (e.date < from || e.date > todayKey) continue;
      if (METRICS[type].mode === "additive") byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.value);
      else if (!byDay.has(e.date)) byDay.set(e.date, e.value); // история отсортирована от новых — берём последнюю запись дня
    }
    const series: ChartDay[] = Array.from({ length: days }, (_, i) => {
      const key = shiftDayKey(from, i);
      return { key, value: byDay.get(key) ?? null };
    });
    const logged = series.filter((d) => d.value !== null) as { key: string; value: number }[];
    const average = logged.length ? logged.reduce((s, d) => s + d.value, 0) / logged.length : null;
    // Изменение: последнее значение против предыдущего (для веса и замеров)
    const distinctDays = [...new Map(relevant.map((e) => [e.date, e])).values()];
    const last = distinctDays[0] ?? null;
    const prev = distinctDays[1] ?? null;
    return { entries: relevant, series, average, loggedDays: logged.length, last, prev, goals: data.goals };
  }, [data, todayKey, type, part, days]);
}

/** Последний замер по каждой части тела и изменение относительно предыдущего. */
export function useLatestMeasurements() {
  const history = useLiveQuery(() => healthRepository.history("measurement"), []);
  return useMemo(() => {
    if (!history) return undefined;
    const map = new Map<string, { last: HealthEntry; prev: HealthEntry | null }>();
    for (const e of history) {
      const part = String(e.details?.part ?? "");
      const cur = map.get(part);
      if (!cur) map.set(part, { last: e, prev: null });
      else if (!cur.prev && e.date !== cur.last.date) cur.prev = e;
    }
    return map;
  }, [history]);
}

export function useHealthActions() {
  const record = useCallback(async (type: HealthType, date: string, value: number, details: Record<string, string | number> | null = null, message?: string) => {
    try {
      const entry = await healthRepository.record(type, date, value, details);
      haptics.notify("success");
      if (message) toast(message, "success");
      return entry;
    } catch (error) {
      haptics.notify("error");
      toast(toDataError(error).userMessage, "error");
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await healthRepository.remove(id);
      haptics.impact("light");
      return true;
    } catch (error) {
      haptics.notify("error");
      toast(toDataError(error).userMessage, "error");
      return false;
    }
  }, []);

  return { record, remove };
}
