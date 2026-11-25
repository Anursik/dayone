"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { formatDecimal, validateRange } from "@/features/nutrition/number-input";
import { kcalFromMacros } from "@/lib/calculations/nutrition";
import type { Food } from "@/lib/db/schemas";
import { formatNumber } from "@/lib/format";
import type { FoodInput } from "@/lib/repositories";
import { haptics } from "@/lib/telegram/haptics";

interface FoodFormProps {
  food?: Food;
  initialName?: string;
  submitLabel: string;
  onSubmit: (input: FoodInput) => Promise<unknown>;
}

/** Собственный продукт: КБЖУ на 100 г. */
export function FoodForm({ food, initialName = "", submitLabel, onSubmit }: FoodFormProps) {
  const [v, setV] = useState({
    name: food?.name ?? initialName,
    kcal: food ? formatDecimal(food.kcal) : "",
    protein: food ? formatDecimal(food.protein) : "",
    fat: food ? formatDecimal(food.fat) : "",
    carbs: food ? formatDecimal(food.carbs) : "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const kcal = validateRange(v.kcal, 0, 1000);
  const protein = validateRange(v.protein, 0, 100);
  const fat = validateRange(v.fat, 0, 100);
  const carbs = validateRange(v.carbs, 0, 100);
  const nameError = v.name.trim() ? null : "Введите название";
  const sumError =
    protein.value !== null && fat.value !== null && carbs.value !== null && protein.value + fat.value + carbs.value > 100.5
      ? "Белки + жиры + углеводы больше 100 г на 100 г"
      : null;
  const estimated =
    protein.value !== null && fat.value !== null && carbs.value !== null ? kcalFromMacros(protein.value, fat.value, carbs.value) : null;
  const invalid = Boolean(nameError || kcal.error || protein.error || fat.error || carbs.error || sumError);
  const show = (e: string | null) => (submitted ? e : null);
  const set = (key: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [key]: e.target.value }));

  const submit = async () => {
    setSubmitted(true);
    if (invalid) {
      haptics.notify("error");
      return;
    }
    setBusy(true);
    await onSubmit({ name: v.name.trim(), kcal: kcal.value!, protein: protein.value!, fat: fat.value!, carbs: carbs.value! });
    setBusy(false);
  };

  return (
    <form
      className="space-y-4 pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <FormField label="Название" maxLength={80} placeholder="Например, «Протеиновый йогурт»" value={v.name} error={show(nameError)} onChange={set("name")} />
      <p className="-mb-1 px-1 text-[13px] font-semibold">На 100 г продукта</p>
      <FormField label="Калорийность" suffix="ккал" inputMode="decimal" value={v.kcal} error={show(kcal.error)} onChange={set("kcal")} />
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Белки" suffix="г" inputMode="decimal" value={v.protein} error={show(protein.error)} onChange={set("protein")} />
        <FormField label="Жиры" suffix="г" inputMode="decimal" value={v.fat} error={show(fat.error)} onChange={set("fat")} />
        <FormField label="Углеводы" suffix="г" inputMode="decimal" value={v.carbs} error={show(carbs.error ?? sumError)} onChange={set("carbs")} />
      </div>
      {estimated !== null ? (
        <p className="px-1 text-[12.5px] text-muted-foreground">
          По БЖУ ≈ {formatNumber(estimated)} ккал
          {kcal.value === null ? (
            <>
              {" "}
              ·{" "}
              <button type="button" className="font-semibold text-foreground underline" onClick={() => setV((s) => ({ ...s, kcal: String(Math.round(estimated)) }))}>
                подставить
              </button>
            </>
          ) : null}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}
