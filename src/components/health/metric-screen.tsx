"use client";

import { SearchX, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { MetricChart } from "@/components/charts/metric-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { DayNavigator } from "@/components/ui/day-navigator";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useHealthActions, useHealthDay, useLatestMeasurements, useMetricHistory } from "@/features/health/use-health";
import { useNow } from "@/hooks/use-now";
import type { Goals, HealthType } from "@/lib/db/schemas";
import { formatLongDate, fromDayKey, toDayKey } from "@/lib/date";
import { formatAxis, formatDelta, formatMetric } from "@/lib/health/format";
import { BODY_PARTS, METRICS, isHealthType } from "@/lib/health/metrics";
import { MetricInput } from "./metric-input";

const shortDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

function goalFor(type: HealthType, goals: Goals | null): number | null {
  if (!goals) return null;
  switch (type) {
    case "water":
      return goals.waterMl;
    case "sleep":
      return goals.sleepMinutes;
    case "steps":
      return goals.stepsTarget;
    case "weight":
      return goals.targetWeightKg;
    default:
      return null;
  }
}

function Screen({ type }: { type: HealthType }) {
  const params = useSearchParams();
  const now = useNow();
  const todayKey = now ? toDayKey(now) : null;
  const [picked, setPicked] = useState<string | null>(params.get("day"));
  const dayKey = picked && todayKey && /^\d{4}-\d{2}-\d{2}$/.test(picked) && picked <= todayKey ? picked : todayKey;
  const [part, setPart] = useState<string>("Талия");
  const m = METRICS[type];
  const day = useHealthDay(dayKey);
  const history = useMetricHistory(type, todayKey, type === "measurement" ? part : null);
  const latest = useLatestMeasurements();
  const { record, remove } = useHealthActions();

  if (!todayKey || !dayKey || !day || !history) return <div className="min-h-[60dvh]" aria-busy="true" />;

  const dayEntries = day.entries.filter((e) => e.type === type);
  const goal = goalFor(type, history.goals);
  const delta = history.last && history.prev ? history.last.value - history.prev.value : null;

  return (
    <>
      <PageHeader title={m.label} backHref="/profile/health/" />
      <DayNavigator dayKey={dayKey} todayKey={todayKey} onChange={setPicked} />

      <Card>
        <MetricInput
          type={type}
          dayEntries={dayEntries}
          onRecord={(value, details) => record(type, dayKey, value, details ?? null, m.mode === "additive" ? `Добавлено: ${formatMetric(type, value)}` : "Сохранено")}
        />
        {m.mode === "additive" && dayEntries.length ? (
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {dayEntries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 text-[14.5px]">
                  <span className="tabular font-semibold">{formatMetric(type, e.value)}</span>
                  {e.details?.kind ? <span className="text-muted-foreground"> · {String(e.details.kind)}</span> : null}
                  <span className="ml-1 text-[12.5px] text-subtle-foreground">{new Date(e.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                </span>
                <button type="button" aria-label={`Удалить ${formatMetric(type, e.value)}`} onClick={() => remove(e.id)} className="grid size-8 place-items-center rounded-full text-muted-foreground active:bg-muted">
                  <X className="size-4" />
                </button>
              </li>
            ))}
            <li className="flex justify-between pt-2.5 text-[14px] font-semibold">
              <span>Итого за день</span>
              <span className="tabular">{formatMetric(type, dayEntries.reduce((s, e) => s + e.value, 0))}</span>
            </li>
          </ul>
        ) : null}
      </Card>

      {type === "measurement" && latest && latest.size ? (
        <>
          <SectionTitle>Последние замеры</SectionTitle>
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {[...latest.entries()].map(([p, v]) => (
                <li key={p} className="flex items-center justify-between px-4 py-2.5 text-[14.5px]">
                  <span>{p}</span>
                  <span className="tabular">
                    <span className="font-semibold">{formatMetric("measurement", v.last.value)}</span>
                    {v.prev ? <span className="ml-2 text-[12.5px] text-muted-foreground">{formatDelta("measurement", v.last.value - v.prev.value)}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}

      <SectionTitle>30 дней</SectionTitle>
      <Card>
        {type === "measurement" ? (
          <div className="no-scrollbar -mx-4 mb-3 overflow-x-auto px-4">
            <SegmentedControl ariaLabel="Часть тела" value={part} onChange={setPart} options={BODY_PARTS.map((p) => ({ value: p, label: p }))} className="w-max min-w-full [&_button]:px-2.5 [&_button]:text-[12.5px]" />
          </div>
        ) : null}
        <div className="mb-3 flex gap-4">
          {m.mode === "additive" || type === "sleep" || type === "steps" ? (
            <div>
              <p className="text-[12.5px] text-muted-foreground">В среднем за день</p>
              <p className="tabular text-[20px] font-bold">{history.average !== null ? formatMetric(type, Math.round(history.average * 10) / 10) : "—"}</p>
            </div>
          ) : (
            <div>
              <p className="text-[12.5px] text-muted-foreground">Последнее</p>
              <p className="tabular text-[20px] font-bold">{history.last ? formatMetric(type, history.last.value) : "—"}</p>
            </div>
          )}
          {delta !== null && (type === "weight" || type === "measurement") ? (
            <div>
              <p className="text-[12.5px] text-muted-foreground">Изменение</p>
              <p className="tabular text-[20px] font-bold">{formatDelta(type, Math.round(delta * 10) / 10)}</p>
            </div>
          ) : null}
          {goal != null ? (
            <div>
              <p className="text-[12.5px] text-muted-foreground">Цель</p>
              <p className="tabular text-[20px] font-bold">{formatMetric(type, goal)}</p>
            </div>
          ) : null}
        </div>
        <MetricChart
          data={history.series}
          kind={m.chart}
          colorVar={m.chartVar}
          format={(v) => formatAxis(type, v)}
          goal={goal}
          goalLabel={goal != null ? `цель ${formatMetric(type, goal)}` : undefined}
          label={`${m.label} за 30 дней`}
        />
        {type === "water" ? <p className="mt-1 px-1 text-[12px] text-muted-foreground">Ось — литры</p> : type === "sleep" ? <p className="mt-1 px-1 text-[12px] text-muted-foreground">Ось — часы</p> : null}
      </Card>

      <SectionTitle>История</SectionTitle>
      {history.entries.length === 0 ? (
        <Card className="text-center text-[14px] text-muted-foreground">Записей пока нет.</Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {history.entries.slice(0, 40).map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">{e.date === todayKey ? "Сегодня" : formatLongDate(fromDayKey(e.date))}</span>
                  {e.details ? <span className="text-[12.5px] text-muted-foreground">{Object.values(e.details).join(" · ")}</span> : null}
                </span>
                <span className="tabular text-[14.5px] font-semibold">{formatMetric(type, e.value)}</span>
                <button type="button" aria-label={`Удалить запись ${shortDate.format(fromDayKey(e.date))}`} onClick={() => remove(e.id)} className="grid size-8 place-items-center rounded-full text-muted-foreground active:bg-muted">
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

export function MetricScreen() {
  const type = useSearchParams().get("type");
  if (!isHealthType(type)) {
    return (
      <>
        <PageHeader title="Показатель" backHref="/profile/health/" />
        <EmptyState icon={SearchX} color="var(--muted-foreground)" title="Показатель не найден" />
      </>
    );
  }
  return <Screen key={type} type={type} />;
}
