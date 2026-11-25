export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

/** Округление до 0,1 — убирает погрешности вычислений с плавающей точкой при хранении. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function roundMacros(m: Macros): Macros {
  return { kcal: round1(m.kcal), protein: round1(m.protein), fat: round1(m.fat), carbs: round1(m.carbs) };
}

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

/** КБЖУ порции: значение на 100 г × граммовка / 100. */
export function macrosForPortion(per100g: Macros, grams: number): Macros {
  const k = grams / 100;
  return {
    kcal: per100g.kcal * k,
    protein: per100g.protein * k,
    fat: per100g.fat * k,
    carbs: per100g.carbs * k,
  };
}

/** Обратный пересчёт: значения на 100 г из порции (для изменения граммовки записи). */
export function per100FromPortion(portion: Macros, grams: number): Macros {
  if (grams <= 0) return { ...ZERO_MACROS };
  return macrosForPortion(portion, 10000 / grams);
}

export interface RecipeIngredient {
  per100: Macros;
  grams: number;
}

export interface RecipeNutrition {
  /** Суммарное КБЖУ всех ингредиентов */
  total: Macros;
  /** Вес сырых ингредиентов */
  rawWeight: number;
  /** Вес готового блюда (выход), по умолчанию — вес ингредиентов */
  yieldWeight: number;
  /** КБЖУ на 100 г готового блюда */
  per100: Macros;
}

/**
 * КБЖУ блюда. При варке/жарке вес меняется (крупа набирает воду, мясо теряет),
 * поэтому значения на 100 г считаются от веса ГОТОВОГО блюда, если он указан.
 */
export function recipeNutrition(ingredients: RecipeIngredient[], yieldGrams: number | null): RecipeNutrition {
  const total = sumMacros(ingredients.map((i) => macrosForPortion(i.per100, i.grams)));
  const rawWeight = ingredients.reduce((s, i) => s + i.grams, 0);
  const yieldWeight = yieldGrams && yieldGrams > 0 ? yieldGrams : rawWeight;
  return {
    total,
    rawWeight,
    yieldWeight,
    per100: yieldWeight > 0 ? macrosForPortion(total, 100 / (yieldWeight / 100)) : { ...ZERO_MACROS },
  };
}

/** Калорийность по БЖУ (4/9/4 ккал на грамм). */
export function kcalFromMacros(protein: number, fat: number, carbs: number): number {
  return protein * 4 + fat * 9 + carbs * 4;
}
