export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

/** Сумма КБЖУ по записям (значения в записях уже рассчитаны на порцию). */
export function sumMacros(items: Macros[]): Macros {
  return items.reduce<Macros>(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      fat: acc.fat + m.fat,
      carbs: acc.carbs + m.carbs,
    }),
    { ...ZERO_MACROS },
  );
}

/** КБЖУ порции: значения на 100 г × граммовка / 100. */
export function macrosForPortion(per100g: Macros, grams: number): Macros {
  const k = grams / 100;
  return {
    kcal: per100g.kcal * k,
    protein: per100g.protein * k,
    fat: per100g.fat * k,
    carbs: per100g.carbs * k,
  };
}
