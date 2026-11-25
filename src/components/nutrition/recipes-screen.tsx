"use client";

import { ChefHat, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { useCatalog, useNutritionActions } from "@/features/nutrition/use-nutrition";
import type { Recipe } from "@/lib/db/schemas";
import { formatNumber, plural } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { MacroLine } from "./macro-line";
import { RecipeForm } from "./recipe-form";

export function RecipesScreen() {
  const catalog = useCatalog();
  const { deleteRecipe } = useNutritionActions();
  const [editing, setEditing] = useState<Recipe | "new" | null>(null);
  const current = editing && editing !== "new" ? editing : undefined;

  return (
    <>
      <PageHeader
        title="Мои блюда"
        subtitle="Рецепты из нескольких продуктов"
        backHref="/nutrition/"
        action={
          <Button size="icon" aria-label="Новое блюдо" className="mb-1" onClick={() => setEditing("new")}>
            <Plus className="size-5" />
          </Button>
        }
      />

      {!catalog ? (
        <div className="min-h-[40dvh]" aria-busy="true" />
      ) : catalog.recipes.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={ChefHat}
            color="var(--c-nutrition)"
            title="Блюд пока нет"
            description="Соберите блюдо из продуктов — КБЖУ на 100 г посчитается автоматически, и его можно будет добавлять одной записью."
          >
            <Button size="lg" onClick={() => setEditing("new")}>
              <Plus />
              Создать блюдо
            </Button>
          </EmptyState>
        </Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {catalog.recipeItems.map((item) => {
              if (item.kind !== "recipe") return null;
              const recipe = catalog.recipes.find((r) => r.id === item.id)!;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.selection();
                      setEditing(recipe);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-nutrition/15 text-nutrition">
                      <ChefHat className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{item.name}</span>
                      <span className="block text-[12.5px] text-muted-foreground">
                        {item.ingredients} {plural(item.ingredients, ["ингредиент", "ингредиента", "ингредиентов"])} · {formatNumber(item.yieldWeight)} г
                        {item.missing ? (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-destructive">
                            <TriangleAlert className="size-3" /> нет {item.missing}
                          </span>
                        ) : null}
                      </span>
                      <MacroLine macros={item.per100} />
                    </span>
                    <span className="tabular text-right text-[14px] font-semibold">
                      {formatNumber(item.per100.kcal)}
                      <span className="block text-[11px] font-medium text-muted-foreground">ккал/100 г</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={current ? "Изменить блюдо" : "Новое блюдо"} className="h-[88dvh]">
        {editing !== null && catalog ? (
          <>
            <RecipeForm key={current?.id ?? "new"} catalog={catalog} recipe={current} onDone={() => setEditing(null)} />
            {current ? (
              <div className="pb-2">
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={async () => {
                    if (await deleteRecipe(current.id)) setEditing(null);
                  }}
                >
                  <Trash2 />
                  Удалить блюдо
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </Sheet>
    </>
  );
}
