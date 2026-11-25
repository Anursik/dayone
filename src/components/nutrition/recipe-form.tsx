"use client";

import { ChevronLeft, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { formatDecimal, validateRange } from "@/features/nutrition/number-input";
import { useNutritionActions, type Catalog, type CatalogItem } from "@/features/nutrition/use-nutrition";
import { recipeNutrition, type Macros } from "@/lib/calculations/nutrition";
import type { Recipe } from "@/lib/db/schemas";
import { formatNumber } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { FoodForm } from "./food-form";
import { FoodPicker } from "./food-picker";
import { MacroGrid } from "./macro-line";
import { PortionForm } from "./portion-form";

interface Ingredient {
  foodId: string;
  name: string;
  per100: Macros;
  grams: number;
}

type Step = { kind: "form" } | { kind: "pick" } | { kind: "grams"; item: CatalogItem } | { kind: "create"; name: string };

export function RecipeForm({ catalog, recipe, onDone }: { catalog: Catalog; recipe?: Recipe; onDone: () => void }) {
  const { saveRecipe, createFood } = useNutritionActions();
  const [step, setStep] = useState<Step>({ kind: "form" });
  const [name, setName] = useState(recipe?.name ?? "");
  const [yieldRaw, setYieldRaw] = useState(recipe?.yieldGrams ? formatDecimal(recipe.yieldGrams) : "");
  const [items, setItems] = useState<Ingredient[]>(() =>
    (recipe?.items ?? []).flatMap((i) => {
      const f = catalog.find("food", i.foodId);
      return f ? [{ foodId: i.foodId, name: f.name, per100: f.per100, grams: i.grams }] : [];
    }),
  );
  const missing = (recipe?.items.length ?? 0) - items.length;
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const yieldField = validateRange(yieldRaw, 1, 100000, { required: false });
  const nutrition = recipeNutrition(items, yieldField.value);
  const nameError = name.trim() ? null : "Введите название";
  const itemsError = items.length ? null : "Добавьте хотя бы один ингредиент";

  const back = (
    <button type="button" onClick={() => setStep({ kind: "form" })} className="-ml-1 mb-2 inline-flex items-center gap-0.5 text-[14.5px] font-medium text-muted-foreground">
      <ChevronLeft className="size-5" />К блюду
    </button>
  );

  if (step.kind === "pick") {
    return (
      <>
        {back}
        <FoodPicker catalog={catalog} includeRecipes={false} onPick={(item) => setStep({ kind: "grams", item })} onCreateFood={(n) => setStep({ kind: "create", name: n })} />
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
            if (food) setStep({ kind: "grams", item: { kind: "food", id: food.id, name: food.name, per100: input, source: "custom" } });
          }}
        />
      </>
    );
  }
  if (step.kind === "grams") {
    const { item } = step;
    return (
      <>
        {back}
        <PortionForm
          name={item.name}
          per100={item.per100}
          submitLabel="Добавить в блюдо"
          onSubmit={async (grams) => {
            setItems((list) => [...list, { foodId: item.id, name: item.name, per100: item.per100, grams }]);
            setStep({ kind: "form" });
          }}
        />
      </>
    );
  }

  const submit = async () => {
    setSubmitted(true);
    if (nameError || itemsError || yieldField.error) {
      haptics.notify("error");
      return;
    }
    setBusy(true);
    const ok = await saveRecipe(
      { name: name.trim(), items: items.map((i) => ({ foodId: i.foodId, grams: i.grams })), yieldGrams: yieldField.value },
      recipe?.id,
    );
    setBusy(false);
    if (ok) onDone();
  };

  return (
    <form
      className="space-y-4 pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <FormField label="Название блюда" maxLength={80} placeholder="Например, «Гречка с курицей»" value={name} error={submitted ? nameError : null} onChange={(e) => setName(e.target.value)} />

      <div>
        <p className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">Ингредиенты (вес в сыром виде)</p>
        {missing > 0 ? (
          <p className="mb-2 rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
            {missing} ингредиент(а) удалены из базы и не учитываются.
          </p>
        ) : null}
        <ul className="divide-y divide-border rounded-2xl bg-muted px-3.5">
          {items.map((i, index) => (
            <li key={`${i.foodId}-${index}`} className="flex items-center gap-2 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-medium">{i.name}</span>
                <span className="tabular text-[12.5px] text-muted-foreground">
                  {formatNumber(i.grams)} г · {formatNumber((i.per100.kcal * i.grams) / 100)} ккал
                </span>
              </span>
              <button
                type="button"
                aria-label={`Убрать «${i.name}»`}
                onClick={() => {
                  haptics.selection();
                  setItems((list) => list.filter((_, idx) => idx !== index));
                }}
                className="grid size-8 place-items-center rounded-full text-muted-foreground active:bg-card"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setStep({ kind: "pick" })} className="flex w-full items-center gap-2 py-3 text-[14.5px] font-semibold text-nutrition">
              <Plus className="size-[18px]" />
              Добавить ингредиент
            </button>
          </li>
        </ul>
        {submitted && itemsError ? <p className="mt-1.5 px-1 text-[12.5px] text-destructive">{itemsError}</p> : null}
      </div>

      <FormField
        label="Вес готового блюда (необязательно)"
        suffix="г"
        inputMode="decimal"
        placeholder={items.length ? formatNumber(nutrition.rawWeight) : "—"}
        hint="Укажите, если вес меняется при готовке: крупа разваривается, мясо ужаривается."
        value={yieldRaw}
        error={yieldField.error}
        onChange={(e) => setYieldRaw(e.target.value)}
      />

      {items.length ? (
        <div className="space-y-2">
          <p className="px-1 text-[13px] text-muted-foreground">
            Всё блюдо: <span className="tabular font-semibold text-foreground">{formatNumber(nutrition.total.kcal)} ккал</span> на{" "}
            {formatNumber(nutrition.yieldWeight)} г. На 100 г:
          </p>
          <MacroGrid macros={nutrition.per100} />
        </div>
      ) : null}

      <Button type="submit" size="lg" disabled={busy}>
        {recipe ? "Сохранить блюдо" : "Создать блюдо"}
      </Button>
    </form>
  );
}
