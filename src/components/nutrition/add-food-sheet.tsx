"use client";

import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { MEAL_LABEL, useCatalog, useNutritionActions, type CatalogItem } from "@/features/nutrition/use-nutrition";
import type { MealType } from "@/lib/db/schemas";
import { formatLongDate, fromDayKey } from "@/lib/date";
import { FoodForm } from "./food-form";
import { FoodPicker } from "./food-picker";
import { PortionForm } from "./portion-form";

type Step = { kind: "pick" } | { kind: "portion"; item: CatalogItem } | { kind: "create"; name: string };

interface AddFoodSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayKey: string;
  todayKey: string;
  meal: MealType;
}

function AddFoodFlow({ dayKey, todayKey, meal, onDone }: Omit<AddFoodSheetProps, "open" | "onOpenChange"> & { onDone: () => void }) {
  const catalog = useCatalog();
  const { addEntry, createFood } = useNutritionActions();
  const [step, setStep] = useState<Step>({ kind: "pick" });

  if (!catalog) return <div className="min-h-[40dvh]" aria-busy="true" />;

  const back = (
    <button type="button" onClick={() => setStep({ kind: "pick" })} className="-ml-1 mb-2 inline-flex items-center gap-0.5 text-[14.5px] font-medium text-muted-foreground">
      <ChevronLeft className="size-5" />К поиску
    </button>
  );

  if (step.kind === "portion") {
    const { item } = step;
    return (
      <>
        {back}
        <PortionForm
          name={item.name}
          per100={item.per100}
          isRecipe={item.kind === "recipe"}
          meal={meal}
          submitLabel="Добавить"
          hint={
            dayKey !== todayKey ? (
              <p className="mt-1 text-[12.5px] font-medium text-nutrition">Запись за {formatLongDate(fromDayKey(dayKey)).toLowerCase()}</p>
            ) : null
          }
          onSubmit={async (grams, mealValue) => {
            const ok = await addEntry({
              date: dayKey,
              meal: mealValue,
              title: item.name,
              grams,
              per100: item.per100,
              foodId: item.kind === "food" ? item.id : null,
              recipeId: item.kind === "recipe" ? item.id : null,
            });
            if (ok) onDone();
          }}
        />
      </>
    );
  }

  if (step.kind === "create") {
    return (
      <>
        {back}
        <FoodForm
          initialName={step.name}
          submitLabel="Сохранить и выбрать"
          onSubmit={async (input) => {
            const food = await createFood(input);
            if (food) setStep({ kind: "portion", item: { kind: "food", id: food.id, name: food.name, per100: input, source: "custom" } });
          }}
        />
      </>
    );
  }

  return (
    <FoodPicker
      catalog={catalog}
      includeRecipes
      onPick={(item) => setStep({ kind: "portion", item })}
      onCreateFood={(name) => setStep({ kind: "create", name })}
    />
  );
}

export function AddFoodSheet({ open, onOpenChange, ...props }: AddFoodSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`Добавить: ${MEAL_LABEL[props.meal].toLowerCase()}`} className="h-[88dvh]">
      {open ? <AddFoodFlow {...props} onDone={() => onOpenChange(false)} /> : null}
    </Sheet>
  );
}
