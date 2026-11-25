"use client";

import { Coffee, Cookie, Moon, Sun, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { SectionTitle } from "@/components/ui/section-title";
import { TodayLabel } from "@/components/ui/today-label";
import { useDashboardSummary } from "@/features/dashboard/use-dashboard-summary";
import { CalorieOverview } from "./calorie-overview";

const MEALS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "breakfast", label: "Завтрак", icon: Coffee },
  { key: "lunch", label: "Обед", icon: Sun },
  { key: "dinner", label: "Ужин", icon: Moon },
  { key: "snack", label: "Перекусы", icon: Cookie },
];

export function NutritionScreen() {
  const {
    summary: { nutrition },
  } = useDashboardSummary();

  return (
    <>
      <PageHeader title="Питание" subtitle={<TodayLabel />} />
      <CalorieOverview nutrition={nutrition} />

      <SectionTitle>Приёмы пищи</SectionTitle>
      <div className="space-y-2.5">
        {MEALS.map((meal) => (
          <Card key={meal.key} className="flex items-center gap-3">
            <IconBadge icon={meal.icon} color="var(--c-nutrition)" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">{meal.label}</p>
              <p className="text-[13px] text-muted-foreground">Пока ничего не добавлено</p>
            </div>
            <span className="tabular text-[15px] font-semibold text-muted-foreground">0 ккал</span>
          </Card>
        ))}
      </div>
      <p className="mt-4 px-1 text-[13px] leading-relaxed text-muted-foreground">
        Добавление продуктов, поиск по локальной базе и собственные блюда появятся в одном из ближайших обновлений.
      </p>
    </>
  );
}
