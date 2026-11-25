"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { computeAnalytics, type Analytics } from "@/lib/calculations/analytics";
import { shiftDayKey } from "@/lib/date";
import {
  habitRepository,
  healthRepository,
  journalRepository,
  nutritionRepository,
  profileRepository,
  workoutRepository,
} from "@/lib/repositories";

export const PERIODS = [
  { value: "7", label: "7 дней", days: 7 },
  { value: "30", label: "30 дней", days: 30 },
  { value: "90", label: "90 дней", days: 90 },
] as const;

export type PeriodValue = (typeof PERIODS)[number]["value"];

/** Аналитика за последние `days` дней по реальным локальным данным. Пересчитывается при любом изменении. */
export function useAnalytics(todayKey: string | null, days: number): (Analytics & { fromKey: string; toKey: string }) | undefined {
  const fromKey = todayKey ? shiftDayKey(todayKey, -(days - 1)) : null;

  const data = useLiveQuery(async () => {
    if (!todayKey || !fromKey) return undefined;
    const [habits, habitLogs, meals, health, sessions, journal, profile] = await Promise.all([
      habitRepository.list(),
      habitRepository.logsBetween(fromKey, todayKey),
      nutritionRepository.entriesBetween(fromKey, todayKey),
      healthRepository.allBetween(fromKey, todayKey),
      workoutRepository.listFinishedSessions(),
      journalRepository.between(fromKey, todayKey),
      profileRepository.get(),
    ]);
    return { key: `${fromKey}|${todayKey}`, habits, habitLogs, meals, health, sessions, journal, goals: profile?.goals ?? null };
  }, [fromKey, todayKey]);

  return useMemo(() => {
    if (!data || !todayKey || !fromKey || data.key !== `${fromKey}|${todayKey}`) return undefined;
    return { ...computeAnalytics({ ...data, fromKey, toKey: todayKey }, todayKey), fromKey, toKey: todayKey };
  }, [data, fromKey, todayKey]);
}
