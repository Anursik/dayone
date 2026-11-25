"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useNow } from "@/hooks/use-now";
import { toDayKey } from "@/lib/date";
import { dashboardRepository } from "@/lib/repositories";
import { EMPTY_DASHBOARD_SUMMARY, type DashboardSummary } from "@/types/dashboard";

/**
 * Живая сводка дня: пересчитывается при любом изменении привычек, питания,
 * показателей здоровья, тренировок или целей профиля, а также при смене дня.
 */
export function useDashboardSummary(): { summary: DashboardSummary; loading: boolean } {
  const now = useNow();
  const dayKey = now ? toDayKey(now) : null;
  const summary = useLiveQuery(
    () => (dayKey ? dashboardRepository.getDaySummary(dayKey) : undefined),
    [dayKey],
  );
  return { summary: summary ?? EMPTY_DASHBOARD_SUMMARY, loading: summary === undefined };
}
