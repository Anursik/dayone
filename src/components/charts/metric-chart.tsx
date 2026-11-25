"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCanHover, useChartTokens } from "@/hooks/use-chart-tokens";
import { fromDayKey } from "@/lib/date";

export interface MetricPoint {
  key: string;
  value: number | null;
}

interface MetricChartProps {
  data: MetricPoint[];
  kind: "line" | "bar";
  /** CSS-переменная цвета данных, например --chart-water */
  colorVar: string;
  format: (v: number) => string;
  goal?: number | null;
  goalLabel?: string;
  height?: number;
  label: string;
}

const tickFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });
const fullFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long" });

/** Один показатель по дням: столбики для суточных величин, линия — для веса и замеров. */
export function MetricChart({ data, kind, colorVar, format, goal, goalLabel, height = 180, label }: MetricChartProps) {
  const t = useChartTokens(colorVar);
  const canHover = useCanHover();
  const rows = data.map((d, i) => ({ i, key: d.key, value: d.value }));
  const values = rows.filter((r) => r.value !== null).map((r) => r.value as number);

  if (values.length === 0) {
    return <p className="rounded-2xl bg-muted px-4 py-6 text-center text-[13.5px] text-muted-foreground">Записей за этот период нет.</p>;
  }
  if (kind === "line" && values.length < 2) {
    return <p className="rounded-2xl bg-muted px-4 py-6 text-center text-[13.5px] text-muted-foreground">График появится после двух записей.</p>;
  }

  const axis = {
    x: (
      <XAxis
        dataKey="i"
        tickLine={false}
        axisLine={false}
        tick={{ fill: t.text, fontSize: 11 }}
        tickFormatter={(i: number) => (rows[i] ? tickFmt.format(fromDayKey(rows[i].key)).replace(".", "") : "")}
        interval="preserveStartEnd"
        minTickGap={24}
      />
    ),
    y: <YAxis tickLine={false} axisLine={false} tick={{ fill: t.text, fontSize: 11 }} width={44} domain={kind === "line" ? ["auto", "auto"] : [0, "auto"]} tickFormatter={(v: number) => format(v)} />,
  };
  const tooltip = (
    <Tooltip
      trigger={canHover ? "hover" : "click"}
      cursor={kind === "bar" ? { fill: t.track, opacity: 0.6 } : { stroke: t.text, strokeDasharray: "3 3" }}
      content={({ active, payload }) => {
        const row = payload?.[0]?.payload as { key: string; value: number | null } | undefined;
        if (!active || !row || row.value === null) return null;
        return (
          <div className="rounded-xl border border-border bg-elevated px-3 py-2 text-[12.5px] shadow-nav">
            <p className="text-muted-foreground">{fullFmt.format(fromDayKey(row.key))}</p>
            <p className="tabular font-semibold text-foreground">{format(row.value)}</p>
          </div>
        );
      }}
    />
  );
  const goalLine =
    goal != null ? (
      <ReferenceLine y={goal} stroke={t.text} strokeDasharray="4 4" strokeOpacity={0.7} ifOverflow="extendDomain" />
    ) : null;

  return (
    <div>
      <div style={{ height }} className="w-full" role="img" aria-label={label}>
        <ResponsiveContainer width="100%" height="100%">
          {kind === "bar" ? (
            <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -8 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke={t.grid} />
              {axis.x}
              {axis.y}
              {tooltip}
              {goalLine}
              <Bar dataKey="value" fill={t.series} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          ) : (
            <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid vertical={false} stroke={t.grid} />
              {axis.x}
              {axis.y}
              {tooltip}
              {goalLine}
              <Line
                type="monotone"
                dataKey="value"
                connectNulls
                stroke={t.series}
                strokeWidth={2}
                dot={{ r: 4, fill: t.series, stroke: t.surface, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: t.series, stroke: t.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      {goal != null && goalLabel ? <p className="mt-1.5 px-1 text-[12px] text-muted-foreground">Пунктир — {goalLabel}</p> : null}
    </div>
  );
}
