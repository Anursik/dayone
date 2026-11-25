import { Activity, Droplets, Footprints, Moon, Ruler, Scale, type LucideIcon } from "lucide-react";
import type { HealthType } from "@/lib/db/schemas";

/**
 * Показатели здоровья. «daily» — одно значение в день (новое заменяет старое),
 * «additive» — за день записей может быть несколько, они суммируются.
 */
export interface MetricDef {
  type: HealthType;
  label: string;
  unit: string;
  icon: LucideIcon;
  /** Цвет иконки (акцент раздела) */
  color: string;
  /** Цвет данных на графике (проверенный шаг) */
  chartVar: string;
  mode: "daily" | "additive";
  chart: "line" | "bar";
  min: number;
  max: number;
  decimals: number;
}

export const METRICS: Record<HealthType, MetricDef> = {
  weight: { type: "weight", label: "Вес", unit: "кг", icon: Scale, color: "var(--c-health)", chartVar: "--chart-health", mode: "daily", chart: "line", min: 20, max: 400, decimals: 1 },
  water: { type: "water", label: "Вода", unit: "мл", icon: Droplets, color: "var(--c-water)", chartVar: "--chart-water", mode: "additive", chart: "bar", min: 1, max: 5000, decimals: 0 },
  sleep: { type: "sleep", label: "Сон", unit: "мин", icon: Moon, color: "var(--c-sleep)", chartVar: "--chart-sleep", mode: "daily", chart: "bar", min: 1, max: 1440, decimals: 0 },
  steps: { type: "steps", label: "Шаги", unit: "шагов", icon: Footprints, color: "var(--c-nutrition)", chartVar: "--chart-nutrition", mode: "daily", chart: "bar", min: 0, max: 100000, decimals: 0 },
  activity: { type: "activity", label: "Активность", unit: "мин", icon: Activity, color: "var(--c-analytics)", chartVar: "--chart-analytics", mode: "additive", chart: "bar", min: 1, max: 1440, decimals: 0 },
  measurement: { type: "measurement", label: "Замеры тела", unit: "см", icon: Ruler, color: "var(--c-workouts)", chartVar: "--chart-workouts", mode: "daily", chart: "line", min: 10, max: 300, decimals: 1 },
};

export const METRIC_ORDER: HealthType[] = ["weight", "water", "sleep", "steps", "activity", "measurement"];

export const BODY_PARTS = ["Талия", "Грудь", "Бёдра", "Ягодицы", "Бицепс", "Бедро", "Шея"] as const;

export const ACTIVITY_KINDS = ["Ходьба", "Бег", "Велосипед", "Плавание", "Йога", "Растяжка", "Спорт", "Другое"] as const;

export const WATER_QUICK = [150, 250, 330, 500];

export function isHealthType(value: string | null): value is HealthType {
  return value !== null && value in METRICS;
}
