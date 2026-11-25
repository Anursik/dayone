"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useCanHover, useChartTokens } from "@/hooks/use-chart-tokens";
import type { ProgressPoint } from "@/lib/calculations/workouts";
import { formatNumber } from "@/lib/format";

type Metric = "oneRepMax" | "maxWeight" | "maxReps" | "volume";

const METRICS: { value: Metric; label: string; unit: string; title: string }[] = [
  { value: "oneRepMax", label: "1ПМ", unit: "кг", title: "Расчётный максимум на 1 повтор" },
  { value: "maxWeight", label: "Вес", unit: "кг", title: "Максимальный рабочий вес" },
  { value: "maxReps", label: "Повторы", unit: "", title: "Максимум повторов в подходе" },
  { value: "volume", label: "Тоннаж", unit: "кг", title: "Тоннаж за тренировку" },
];

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

export function ProgressChart({ points, hasWeight }: { points: ProgressPoint[]; hasWeight: boolean }) {
  const options = hasWeight ? METRICS : METRICS.filter((m) => m.value === "maxReps");
  const [metric, setMetric] = useState<Metric>(hasWeight ? "oneRepMax" : "maxReps");
  const active = options.find((m) => m.value === metric) ?? options[0];
  const chart = useChartTokens("--chart-workouts");
  const tokens = { line: chart.series, text: chart.text, grid: chart.grid, surface: chart.surface };
  // Мышь — подсказка при наведении; сенсорный экран — по касанию (надёжнее, чем эмуляция наведения)
  const canHover = useCanHover();

  const metricKey = active.value;
  // Ось X — по порядковому номеру точки: в один день может быть несколько тренировок,
  // а одинаковые подписи-даты сломали бы сопоставление точек и подсказки
  const data = points
    .filter((p) => p[metricKey] !== null)
    .map((p, i) => ({ i, at: p.at, label: dateFmt.format(new Date(p.at)).replace(".", ""), value: p[metricKey] }));

  return (
    <div>
      {options.length > 1 ? (
        <SegmentedControl ariaLabel="Показатель" value={active.value} onChange={setMetric} options={options.map((m) => ({ value: m.value, label: m.label }))} className="mb-3" />
      ) : null}
      <p className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">
        {active.title}
        {active.unit ? `, ${active.unit}` : ""}
      </p>
      {data.length < 2 ? (
        <p className="rounded-2xl bg-muted px-4 py-6 text-center text-[13.5px] text-muted-foreground">
          График появится после двух тренировок с этим упражнением.
        </p>
      ) : (
        <div className="h-[200px] w-full" role="img" aria-label={`График: ${active.title}`}>
          <ResponsiveContainer width="100%" height="100%">
            {/* key: при смене показателя график пересоздаётся — иначе касание после смены данных не показывает подсказку */}
            <LineChart key={metricKey} data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke={tokens.grid} />
              <XAxis
                dataKey="i"
                tickLine={false}
                axisLine={false}
                tick={{ fill: tokens.text, fontSize: 11 }}
                tickFormatter={(i: number) => data[i]?.label ?? ""}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: tokens.text, fontSize: 11 }} width={44} domain={["auto", "auto"]} allowDecimals={false} />
              <Tooltip
                trigger={canHover ? "hover" : "click"}
                cursor={{ stroke: tokens.text, strokeWidth: 1, strokeDasharray: "3 3" }}
                content={({ active: on, payload }) =>
                  on && payload?.length ? (
                    <div className="rounded-xl border border-border bg-elevated px-3 py-2 text-[12.5px] shadow-nav">
                      <p className="text-muted-foreground">{payload[0].payload.label}</p>
                      <p className="tabular font-semibold text-foreground">
                        {active.value === "oneRepMax"
                          ? Number(payload[0].value).toLocaleString("ru-RU", { maximumFractionDigits: 1 })
                          : formatNumber(Number(payload[0].value))}
                        {active.unit ? ` ${active.unit}` : ""}
                      </p>
                    </div>
                  ) : null
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={tokens.line}
                strokeWidth={2}
                dot={{ r: 4, fill: tokens.line, stroke: tokens.surface, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: tokens.line, stroke: tokens.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
