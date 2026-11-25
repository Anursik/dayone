import type { HealthType } from "@/lib/db/schemas";
import { formatDuration, formatNumber } from "@/lib/format";

const one = (v: number) => v.toLocaleString("ru-RU", { maximumFractionDigits: 1 });

/** Значение показателя для отображения. */
export function formatMetric(type: HealthType, value: number): string {
  switch (type) {
    case "weight":
      return `${one(value)} кг`;
    case "water":
      return value >= 1000 ? `${(value / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} л` : `${formatNumber(value)} мл`;
    case "sleep":
      return formatDuration(value);
    case "steps":
      return formatNumber(value);
    case "activity":
      return `${formatNumber(value)} мин`;
    case "measurement":
      return `${one(value)} см`;
  }
}

/** Короткая подпись для оси графика. */
export function formatAxis(type: HealthType, value: number): string {
  switch (type) {
    case "water":
      return `${(value / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}`;
    case "sleep":
      return `${(value / 60).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}`;
    case "steps":
      return value >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value));
    default:
      return one(value);
  }
}

export function formatDelta(type: HealthType, delta: number): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
  return `${sign}${formatMetric(type, Math.abs(delta))}`;
}
