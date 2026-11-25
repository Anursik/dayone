"use client";

import { ChevronRight, Droplets } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { DayNavigator } from "@/components/ui/day-navigator";
import { IconBadge } from "@/components/ui/icon-badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionTitle } from "@/components/ui/section-title";
import { useHealthActions, useHealthDay, useLatestMeasurements } from "@/features/health/use-health";
import { useNow } from "@/hooks/use-now";
import type { HealthType } from "@/lib/db/schemas";
import { formatLongDate, fromDayKey, toDayKey } from "@/lib/date";
import { formatMetric } from "@/lib/health/format";
import { METRICS, WATER_QUICK } from "@/lib/health/metrics";
import { formatNumber } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";

function metricHref(type: HealthType, dayKey: string) {
  return `/profile/health/metric/?type=${type}&day=${dayKey}`;
}

function Tile({ type, dayKey, value, hint }: { type: HealthType; dayKey: string; value: string; hint: string }) {
  const m = METRICS[type];
  return (
    <Link href={metricHref(type, dayKey)} onClick={() => haptics.selection()} className="block h-full transition-transform active:scale-[0.98]">
      <Card className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <IconBadge icon={m.icon} color={m.color} size="sm" />
          <ChevronRight className="size-4 text-subtle-foreground" />
        </div>
        <p className="mt-3 text-[13px] font-medium text-muted-foreground">{m.label}</p>
        <p className="tabular truncate text-[20px] leading-tight font-bold tracking-tight">{value}</p>
        <p className="truncate text-[12.5px] text-muted-foreground">{hint}</p>
      </Card>
    </Link>
  );
}

export function HealthScreen() {
  const now = useNow();
  const todayKey = now ? toDayKey(now) : null;
  const [picked, setPicked] = useState<string | null>(null);
  const dayKey = picked && todayKey && picked <= todayKey ? picked : todayKey;
  const day = useHealthDay(dayKey);
  const measurements = useLatestMeasurements();
  const { record } = useHealthActions();
  const [busy, setBusy] = useState(false);

  if (!todayKey || !dayKey || !day) {
    return (
      <>
        <PageHeader title="Здоровье" backHref="/profile" />
        <div className="min-h-[60dvh]" aria-busy="true" />
      </>
    );
  }

  const g = day.goals;
  const waterGoal = g?.waterMl ?? null;
  const addWater = async (ml: number) => {
    setBusy(true);
    await record("water", dayKey, ml, null);
    setBusy(false);
  };

  const weightHint = day.weight !== null
    ? g?.targetWeightKg ? `цель ${formatMetric("weight", g.targetWeightKg)}` : "за этот день"
    : day.latestWeight ? `последний: ${formatLongDate(fromDayKey(day.latestWeight.date)).toLowerCase()}` : "Нет записей";

  return (
    <>
      <PageHeader title="Здоровье" backHref="/profile" />
      <DayNavigator dayKey={dayKey} todayKey={todayKey} onChange={setPicked} />

      <Card>
        <div className="flex items-center gap-4">
          <ProgressRing value={waterGoal ? day.water / waterGoal : 0} size={84} stroke={8} color="var(--c-water)" label="Вода за день">
            <Droplets className="size-6 text-water" />
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-muted-foreground">Вода</p>
            <p className="tabular text-[24px] leading-tight font-bold tracking-tight">{formatMetric("water", day.water)}</p>
            <p className="text-[12.5px] text-muted-foreground">{waterGoal ? `из ${formatMetric("water", waterGoal)}` : "Цель не задана"}</p>
          </div>
          <Link href={metricHref("water", dayKey)} aria-label="Вода: подробнее" className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">
            <ChevronRight className="size-5" />
          </Link>
        </div>
        <div className="mt-3.5 grid grid-cols-4 gap-2">
          {WATER_QUICK.map((ml) => (
            <button
              key={ml}
              type="button"
              disabled={busy}
              onClick={() => addWater(ml)}
              aria-label={`Добавить ${ml} мл воды`}
              className="rounded-xl bg-water/12 py-2.5 text-[14px] font-bold text-water transition-transform active:scale-95 disabled:opacity-50"
            >
              +{ml}
            </button>
          ))}
        </div>
      </Card>

      <SectionTitle>Показатели</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Tile type="weight" dayKey={dayKey} value={day.weight !== null ? formatMetric("weight", day.weight) : day.latestWeight ? formatMetric("weight", day.latestWeight.value) : "—"} hint={weightHint} />
        <Tile
          type="sleep"
          dayKey={dayKey}
          value={day.sleep !== null ? formatMetric("sleep", day.sleep) : "—"}
          hint={day.sleep !== null ? (g?.sleepMinutes ? `цель ${formatMetric("sleep", g.sleepMinutes)}` : "за ночь") : "Нет записи за ночь"}
        />
        <Tile
          type="steps"
          dayKey={dayKey}
          value={day.steps !== null ? formatMetric("steps", day.steps) : "—"}
          hint={g?.stepsTarget ? `цель ${formatNumber(g.stepsTarget)}` : day.steps !== null ? "шагов" : "Нет записи"}
        />
        <Tile
          type="activity"
          dayKey={dayKey}
          value={day.activity ? formatMetric("activity", day.activity) : "—"}
          hint={day.activityEntries.length ? [...new Set(day.activityEntries.map((e) => String(e.details?.kind ?? "")))].filter(Boolean).join(", ") : "Нет записей"}
        />
      </div>
      <div className="mt-3">
        <Tile
          type="measurement"
          dayKey={dayKey}
          value={measurements && measurements.size ? `${measurements.size} ${measurements.size === 1 ? "замер" : measurements.size < 5 ? "замера" : "замеров"}` : "—"}
          hint={measurements && measurements.size ? [...measurements.entries()].slice(0, 3).map(([p, v]) => `${p} ${formatMetric("measurement", v.last.value)}`).join(" · ") : "Талия, грудь, бёдра и другие"}
        />
      </div>
      <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-muted-foreground">
        Показатели вводятся вручную. Нормы воды, сна и шагов задаются в «Профиль и цели».
      </p>
    </>
  );
}
