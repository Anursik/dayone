"use client";

import { Activity, Droplets, Footprints, Moon, Ruler, Scale, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { TodayLabel } from "@/components/ui/today-label";

interface Metric {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const METRICS: Metric[] = [
  { key: "weight", label: "Вес", icon: Scale, color: "var(--c-health)" },
  { key: "water", label: "Вода", icon: Droplets, color: "var(--c-water)" },
  { key: "sleep", label: "Сон", icon: Moon, color: "var(--c-sleep)" },
  { key: "steps", label: "Шаги", icon: Footprints, color: "var(--c-nutrition)" },
  { key: "activity", label: "Активность", icon: Activity, color: "var(--c-analytics)" },
  { key: "body", label: "Замеры тела", icon: Ruler, color: "var(--c-workouts)" },
];

export function HealthScreen() {
  return (
    <>
      <PageHeader title="Здоровье" subtitle={<TodayLabel />} backHref="/profile" />
      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((metric) => (
          <Card key={metric.key}>
            <IconBadge icon={metric.icon} color={metric.color} size="sm" />
            <p className="mt-3 text-[13px] font-medium text-muted-foreground">{metric.label}</p>
            <p className="text-[20px] font-bold tracking-tight">—</p>
            <p className="text-[12.5px] text-muted-foreground">Нет записей</p>
          </Card>
        ))}
      </div>
      <p className="mt-4 px-1 text-[13px] leading-relaxed text-muted-foreground">
        Показатели вводятся вручную. Ввод и история появятся в одном из ближайших обновлений.
      </p>
    </>
  );
}
