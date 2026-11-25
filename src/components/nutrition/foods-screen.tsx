"use client";

import { Apple, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { useCatalog, useNutritionActions } from "@/features/nutrition/use-nutrition";
import type { Food } from "@/lib/db/schemas";
import { formatNumber } from "@/lib/format";
import { BUILTIN_FOODS } from "@/lib/nutrition/food-database";
import { haptics } from "@/lib/telegram/haptics";
import { FoodForm } from "./food-form";
import { MacroLine } from "./macro-line";

export function FoodsScreen() {
  const catalog = useCatalog();
  const { createFood, updateFood, deleteFood } = useNutritionActions();
  const [editing, setEditing] = useState<Food | "new" | null>(null);
  const current = editing && editing !== "new" ? editing : undefined;

  return (
    <>
      <PageHeader
        title="Мои продукты"
        subtitle={`Свои продукты дополняют базу из ${BUILTIN_FOODS.length}`}
        backHref="/nutrition/"
        action={
          <Button size="icon" aria-label="Новый продукт" className="mb-1" onClick={() => setEditing("new")}>
            <Plus className="size-5" />
          </Button>
        }
      />

      {!catalog ? (
        <div className="min-h-[40dvh]" aria-busy="true" />
      ) : catalog.customFoods.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={Apple}
            color="var(--c-health)"
            title="Своих продуктов пока нет"
            description="Добавьте продукт с этикетки: калорийность и БЖУ на 100 г. Он появится в поиске при добавлении еды."
          >
            <Button size="lg" onClick={() => setEditing("new")}>
              <Plus />
              Добавить продукт
            </Button>
          </EmptyState>
        </Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {catalog.customFoods.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setEditing(f);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{f.name}</span>
                    <MacroLine macros={f} />
                  </span>
                  <span className="tabular text-[14px] font-semibold">
                    {formatNumber(f.kcal)} <span className="text-[12px] font-medium text-muted-foreground">ккал</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={current ? "Изменить продукт" : "Новый продукт"}>
        {editing !== null ? (
          <>
            <FoodForm
              key={current?.id ?? "new"}
              food={current}
              submitLabel={current ? "Сохранить" : "Добавить продукт"}
              onSubmit={async (input) => {
                const ok = current ? await updateFood(current.id, input) : await createFood(input);
                if (ok) setEditing(null);
              }}
            />
            {current ? (
              <div className="pb-2">
                <p className="mb-2 px-1 text-[12.5px] text-muted-foreground">
                  Изменения не затрагивают уже записанные приёмы пищи — в истории сохраняется КБЖУ на момент записи.
                </p>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={async () => {
                    if (await deleteFood(current.id)) setEditing(null);
                  }}
                >
                  <Trash2 />
                  Удалить продукт
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </Sheet>
    </>
  );
}
