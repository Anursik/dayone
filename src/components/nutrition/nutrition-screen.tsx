"use client";

import { Apple, ChefHat } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ListGroup, ListRowLink } from "@/components/ui/list-row";
import { SectionTitle } from "@/components/ui/section-title";
import { MEALS, defaultMealForNow, useCatalog, useNutritionDay, useNutritionHistory } from "@/features/nutrition/use-nutrition";
import { useNow } from "@/hooks/use-now";
import type { MealEntry, MealType } from "@/lib/db/schemas";
import { toDayKey } from "@/lib/date";
import { plural } from "@/lib/format";
import { BUILTIN_FOODS } from "@/lib/nutrition/food-database";
import { AddFoodSheet } from "./add-food-sheet";
import { CalorieOverview } from "./calorie-overview";
import { DayNavigator } from "./day-navigator";
import { EntryEditSheet } from "./entry-edit-sheet";
import { MealCard } from "./meal-card";
import { NutritionHistoryCard } from "./nutrition-history-card";

export function NutritionScreen() {
  const now = useNow();
  const todayKey = now ? toDayKey(now) : null;
  const [picked, setPicked] = useState<string | null>(null);
  const dayKey = picked && todayKey && picked <= todayKey ? picked : todayKey;
  const day = useNutritionDay(dayKey);
  const history = useNutritionHistory(todayKey);
  const catalog = useCatalog();
  const [addMeal, setAddMeal] = useState<MealType | null>(null);
  const [editing, setEditing] = useState<MealEntry | null>(null);

  if (!todayKey || !dayKey || !day) {
    return (
      <>
        <PageHeader title="Питание" />
        <div className="min-h-[60dvh]" aria-busy="true" />
      </>
    );
  }

  const goalMissing = day.overview.caloriesGoal === null;

  return (
    <>
      <PageHeader
        title="Питание"
        action={
          <Link href="/profile/edit/" className="mb-1.5 text-[14px] font-semibold text-nutrition">
            {goalMissing ? "Задать норму" : "Норма"}
          </Link>
        }
      />
      <DayNavigator dayKey={dayKey} todayKey={todayKey} onChange={setPicked} />
      <CalorieOverview nutrition={day.overview} />

      <SectionTitle>Приёмы пищи</SectionTitle>
      <div className="space-y-2.5">
        {MEALS.map((m) => (
          <MealCard
            key={m.key}
            meal={m.key}
            label={m.label}
            entries={day.byMeal[m.key]}
            total={day.mealTotals[m.key]}
            onAdd={() => setAddMeal(m.key)}
            onEdit={setEditing}
          />
        ))}
      </div>

      {history ? (
        <>
          <SectionTitle>История за 7 дней</SectionTitle>
          <NutritionHistoryCard {...history} selectedKey={dayKey} onSelect={setPicked} />
        </>
      ) : null}

      <SectionTitle>Моя база</SectionTitle>
      <ListGroup>
        <ListRowLink
          href="/nutrition/recipes/"
          icon={ChefHat}
          color="var(--c-nutrition)"
          title="Мои блюда"
          subtitle={catalog ? `${catalog.recipes.length} ${plural(catalog.recipes.length, ["блюдо", "блюда", "блюд"])}` : " "}
        />
        <ListRowLink
          href="/nutrition/foods/"
          icon={Apple}
          color="var(--c-health)"
          title="Мои продукты"
          subtitle={catalog ? `${catalog.customFoods.length} своих + база из ${BUILTIN_FOODS.length} продуктов` : " "}
        />
      </ListGroup>

      <AddFoodSheet
        open={addMeal !== null}
        onOpenChange={(o) => !o && setAddMeal(null)}
        dayKey={dayKey}
        todayKey={todayKey}
        meal={addMeal ?? defaultMealForNow()}
      />
      <EntryEditSheet entry={editing} onClose={() => setEditing(null)} />
    </>
  );
}
