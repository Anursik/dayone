"use client";

import { ChefHat } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { validateRange } from "@/features/nutrition/number-input";
import { MEALS } from "@/features/nutrition/use-nutrition";
import { macrosForPortion, type Macros } from "@/lib/calculations/nutrition";
import type { MealType } from "@/lib/db/schemas";
import { formatNumber } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { MacroGrid, MacroLine } from "./macro-line";

interface PortionFormProps {
  name: string;
  per100: Macros;
  isRecipe?: boolean;
  initialGrams?: number;
  /** Если не передан — выбор приёма пищи не показывается */
  meal?: MealType;
  submitLabel: string;
  hint?: ReactNode;
  onSubmit: (grams: number, meal: MealType) => Promise<unknown>;
  extraActions?: ReactNode;
}

const QUICK = [50, 100, 150, 200, 250, 300];

/** Ввод граммовки с мгновенным расчётом КБЖУ порции. */
export function PortionForm({ name, per100, isRecipe, initialGrams, meal, submitLabel, hint, onSubmit, extraActions }: PortionFormProps) {
  const [raw, setRaw] = useState(initialGrams ? String(initialGrams) : "100");
  const [mealValue, setMealValue] = useState<MealType>(meal ?? "snack");
  const [busy, setBusy] = useState(false);
  const { value: grams, error } = validateRange(raw, 1, 5000);
  const portion = macrosForPortion(per100, grams ?? 0);

  const submit = async () => {
    if (grams === null) {
      haptics.notify("error");
      return;
    }
    setBusy(true);
    await onSubmit(grams, mealValue);
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
      <div className="flex items-start gap-3">
        {isRecipe ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-nutrition/15 text-nutrition">
            <ChefHat className="size-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-[17px] leading-snug font-semibold">{name}</p>
          <p className="text-[12.5px] text-muted-foreground">
            На 100 г: {formatNumber(per100.kcal)} ккал · <MacroLine macros={per100} />
          </p>
          {hint}
        </div>
      </div>

      <FormField
        label="Порция"
        suffix="г"
        inputMode="decimal"
        value={raw}
        error={error}
        onChange={(e) => setRaw(e.target.value)}
        onFocus={(e) => e.target.select()}
      />
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {QUICK.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              haptics.selection();
              setRaw(String(g));
            }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${grams === g ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {g} г
          </button>
        ))}
      </div>

      <MacroGrid macros={portion} />

      {meal ? (
        <SegmentedControl
          ariaLabel="Приём пищи"
          value={mealValue}
          onChange={setMealValue}
          options={MEALS.map((m) => ({ value: m.key, label: m.label }))}
          className="[&_button]:px-1 [&_button]:text-[12.5px]"
        />
      ) : null}

      <Button type="submit" size="lg" disabled={busy || grams === null}>
        {submitLabel}
      </Button>
      {extraActions}
    </form>
  );
}
