"use client";

import { Apple, BarChart3, Dumbbell, ListChecks, Moon, Scale, Smile, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { MetricChart } from "@/components/charts/metric-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBadge } from "@/components/ui/icon-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PERIODS, useAnalytics, type PeriodValue } from "@/features/analytics/use-analytics";
import { moodEmoji } from "@/features/journal/use-journal";
import { useNow } from "@/hooks/use-now";
import type { DayPoint } from "@/lib/calculations/analytics";
import { toDayKey } from "@/lib/date";
import { formatDuration, formatNumber, plural } from "@/lib/format";
import { habitColor } from "@/lib/habits/appearance";
import { formatMetric } from "@/lib/health/format";

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
const one = (v: number) => v.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
const hasData = (d: DayPoint[]) => d.some((p) => p.value !== null);

function Kpi({ icon, color, label, value, hint }: { icon: LucideIcon; color: string; label: string; value: string; hint: string }) {
  return (
    <Card className="p-3.5">
      <IconBadge icon={icon} color={color} size="sm" />
      <p className="tabular mt-2.5 truncate text-[20px] leading-tight font-bold">{value}</p>
      <p className="truncate text-[12.5px] font-medium text-muted-foreground">{label}</p>
      <p className="truncate text-[12px] text-subtle-foreground">{hint}</p>
    </Card>
  );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <Card>{empty ? <p className="py-3 text-center text-[13.5px] text-muted-foreground">Нет данных за этот период.</p> : children}</Card>
    </>
  );
}

function Stats({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2">
      {items.map((s) => (
        <div key={s.label}>
          <p className="text-[12.5px] text-muted-foreground">{s.label}</p>
          <p className="tabular text-[18px] font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsScreen() {
  const now = useNow();
  const todayKey = now ? toDayKey(now) : null;
  const [period, setPeriod] = useState<PeriodValue>("30");
  const days = PERIODS.find((p) => p.value === period)!.days;
  const a = useAnalytics(todayKey, days);

  const header = (
    <>
      <PageHeader title="Статистика" subtitle="По вашим данным на этом устройстве" backHref="/profile" />
      <SegmentedControl ariaLabel="Период" value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.value, label: p.label }))} className="mb-4" />
    </>
  );

  if (!a) {
    return (
      <>
        {header}
        <div className="min-h-[60dvh]" aria-busy="true" />
      </>
    );
  }

  const anything =
    a.habits.planned > 0 || a.nutrition.loggedDays > 0 || hasData(a.weight.daily) || a.workouts.count > 0 || hasData(a.activity.daily) ||
    hasData(a.activity.stepsDaily) || hasData(a.sleep.daily) || hasData(a.water.daily) || a.mood.entries > 0;

  if (!anything) {
    return (
      <>
        {header}
        <Card className="p-0">
          <EmptyState
            icon={BarChart3}
            color="var(--c-analytics)"
            title="Пока нечего показать"
            description="Графики строятся только по вашим реальным данным: привычкам, питанию, весу, тренировкам и дневнику. Начните вести записи — статистика появится здесь."
          />
        </Card>
      </>
    );
  }

  return (
    <>
      {header}

      <Card className="flex items-center gap-4">
        <ProgressRing value={a.progressAvg ?? 0} size={96} stroke={10} color="var(--c-analytics)" label="Общий прогресс">
          <span className="tabular text-[22px] font-bold">{pct(a.progressAvg)}</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-[17px] font-semibold">Общий прогресс</p>
          <p className="text-[13px] leading-snug text-muted-foreground">
            Среднее выполнение дневных целей: привычки, калории, вода и сон — по дням, где есть данные.
          </p>
        </div>
      </Card>
      {hasData(a.progress) ? (
        <Card className="mt-3">
          <MetricChart data={a.progress} kind="bar" colorVar="--chart-analytics" format={(v) => `${Math.round(v * 100)}%`} label="Общий прогресс по дням" height={150} />
        </Card>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Kpi icon={ListChecks} color="var(--c-habits)" label="Привычки" value={pct(a.habits.rate)} hint={a.habits.planned ? `${a.habits.done} из ${a.habits.planned} отметок` : "нет данных"} />
        <Kpi icon={Dumbbell} color="var(--c-workouts)" label="Тренировки" value={String(a.workouts.count)} hint={a.workouts.minutes ? formatDuration(a.workouts.minutes) : "нет данных"} />
        <Kpi icon={Apple} color="var(--c-nutrition)" label="Калории в среднем" value={a.nutrition.avgKcal !== null ? formatNumber(a.nutrition.avgKcal) : "—"} hint={a.nutrition.loggedDays ? `за ${a.nutrition.loggedDays} ${plural(a.nutrition.loggedDays, ["день", "дня", "дней"])} с записями` : "нет данных"} />
        <Kpi icon={Scale} color="var(--c-health)" label="Вес" value={a.weight.last !== null ? formatMetric("weight", a.weight.last) : "—"} hint={a.weight.change !== null ? `${a.weight.change > 0 ? "+" : a.weight.change < 0 ? "−" : "±"}${one(Math.abs(a.weight.change))} кг за период` : "нет изменений"} />
        <Kpi icon={Moon} color="var(--c-sleep)" label="Сон в среднем" value={a.sleep.avg !== null ? formatDuration(Math.round(a.sleep.avg)) : "—"} hint={a.sleep.goal ? `цель ${formatDuration(a.sleep.goal)}` : "цель не задана"} />
        <Kpi icon={Smile} color="var(--c-journal)" label="Настроение" value={a.mood.avgMood !== null ? `${moodEmoji(Math.round(a.mood.avgMood))} ${one(a.mood.avgMood)}` : "—"} hint={a.mood.entries ? `${a.mood.entries} ${plural(a.mood.entries, ["запись", "записи", "записей"])} в дневнике` : "нет записей"} />
      </div>

      <Section title="Привычки" empty={a.habits.planned === 0}>
        <MetricChart data={a.habits.daily} kind="bar" colorVar="--chart-habits" format={(v) => `${Math.round(v * 100)}%`} label="Выполнение привычек по дням" height={150} />
        <ul className="mt-4 space-y-3">
          {a.habits.perHabit.map((h) => (
            <li key={h.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-[14px]">
                <span className="truncate font-medium">{h.name}</span>
                <span className="tabular shrink-0 text-muted-foreground">
                  <span className="font-semibold text-foreground">{pct(h.rate)}</span> · {h.done}/{h.planned}
                </span>
              </div>
              <ProgressBar value={h.rate ?? 0} color={habitColor(h.color)} label={h.name} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Питание" empty={a.nutrition.loggedDays === 0}>
        <Stats
          items={[
            { label: "Ккал в среднем", value: a.nutrition.avgKcal !== null ? formatNumber(a.nutrition.avgKcal) : "—" },
            ...(a.nutrition.avgMacros
              ? [{ label: "Б / Ж / У, г", value: `${formatNumber(a.nutrition.avgMacros.protein)} / ${formatNumber(a.nutrition.avgMacros.fat)} / ${formatNumber(a.nutrition.avgMacros.carbs)}` }]
              : []),
            ...(a.nutrition.goal ? [{ label: "В норме ±10%", value: `${a.nutrition.daysOnTarget} из ${a.nutrition.loggedDays} дн.` }] : []),
          ]}
        />
        <MetricChart data={a.nutrition.daily} kind="bar" colorVar="--chart-nutrition" format={(v) => formatNumber(v)} goal={a.nutrition.goal} goalLabel={a.nutrition.goal ? `норма ${formatNumber(a.nutrition.goal)} ккал` : undefined} label="Калории по дням" />
      </Section>

      <Section title="Вес" empty={!hasData(a.weight.daily)}>
        <Stats
          items={[
            { label: "Начало периода", value: a.weight.first !== null ? formatMetric("weight", a.weight.first) : "—" },
            { label: "Сейчас", value: a.weight.last !== null ? formatMetric("weight", a.weight.last) : "—" },
            { label: "Изменение", value: a.weight.change !== null ? `${a.weight.change > 0 ? "+" : a.weight.change < 0 ? "−" : "±"}${one(Math.abs(a.weight.change))} кг` : "—" },
          ]}
        />
        <MetricChart data={a.weight.daily} kind="line" colorVar="--chart-health" format={one} label="Вес по дням" />
      </Section>

      <Section title="Тренировки" empty={a.workouts.count === 0}>
        <Stats
          items={[
            { label: "Тренировок", value: String(a.workouts.count) },
            { label: "Время", value: formatDuration(a.workouts.minutes) },
            { label: "Подходов", value: String(a.workouts.sets) },
            { label: "Тоннаж", value: `${formatNumber(a.workouts.volume)} кг` },
          ]}
        />
        <MetricChart data={a.workouts.daily} kind="bar" colorVar="--chart-workouts" format={(v) => (v >= 1000 ? `${one(v / 1000)}т` : formatNumber(v))} label="Тоннаж по дням" height={150} />
        <p className="mt-1 px-1 text-[12px] text-muted-foreground">Тоннаж — сумма вес × повторы за день.</p>
      </Section>

      <Section title="Активность" empty={!hasData(a.activity.daily) && !hasData(a.activity.stepsDaily)}>
        <Stats
          items={[
            { label: "Активность", value: `${formatNumber(a.activity.totalMinutes)} мин` },
            { label: "Шаги в среднем", value: a.activity.avgSteps !== null ? formatNumber(a.activity.avgSteps) : "—" },
          ]}
        />
        {hasData(a.activity.daily) ? (
          <MetricChart data={a.activity.daily} kind="bar" colorVar="--chart-analytics" format={(v) => formatNumber(v)} label="Минуты активности по дням" height={150} />
        ) : (
          <MetricChart data={a.activity.stepsDaily} kind="bar" colorVar="--chart-nutrition" format={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} label="Шаги по дням" height={150} />
        )}
      </Section>

      <Section title="Сон" empty={!hasData(a.sleep.daily)}>
        <MetricChart data={a.sleep.daily} kind="bar" colorVar="--chart-sleep" format={(v) => one(v / 60)} goal={a.sleep.goal} goalLabel={a.sleep.goal ? `цель ${formatDuration(a.sleep.goal)}` : undefined} label="Сон по дням, часы" height={150} />
      </Section>

      <Section title="Вода" empty={!hasData(a.water.daily)}>
        <MetricChart data={a.water.daily} kind="bar" colorVar="--chart-water" format={(v) => one(v / 1000)} goal={a.water.goal} goalLabel={a.water.goal ? `цель ${formatMetric("water", a.water.goal)}` : undefined} label="Вода по дням, литры" height={150} />
      </Section>

      <Section title="Настроение" empty={!hasData(a.mood.daily)}>
        <Stats
          items={[
            { label: "Среднее настроение", value: a.mood.avgMood !== null ? `${moodEmoji(Math.round(a.mood.avgMood))} ${one(a.mood.avgMood)} из 5` : "—" },
            { label: "Средняя оценка дня", value: a.mood.avgRating !== null ? `${one(a.mood.avgRating)} из 10` : "—" },
          ]}
        />
        <MetricChart data={a.mood.daily} kind="line" colorVar="--chart-journal" format={(v) => String(Math.round(v))} label="Настроение по дням (1–5)" height={150} integerDomain={[1, 5]} />
      </Section>
    </>
  );
}
