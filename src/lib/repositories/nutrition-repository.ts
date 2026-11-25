import { macrosForPortion, per100FromPortion, roundMacros, type Macros } from "@/lib/calculations/nutrition";
import { getDb } from "@/lib/db/database";
import { DataError, withDataErrors } from "@/lib/db/errors";
import { createId } from "@/lib/db/ids";
import {
  foodSchema,
  mealEntrySchema,
  recipeSchema,
  type Food,
  type MealEntry,
  type MealType,
  type Recipe,
} from "@/lib/db/schemas";
import { toDayKey } from "@/lib/date";
import { getBuiltinFood, isBuiltinFoodId } from "@/lib/nutrition/food-database";

export interface FoodInput {
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface RecipeInput {
  name: string;
  items: { foodId: string; grams: number }[];
  yieldGrams: number | null;
}

export interface NewMealEntry {
  date: string;
  meal: MealType;
  title: string;
  grams: number;
  /** КБЖУ на 100 г продукта или блюда */
  per100: Macros;
  foodId: string | null;
  recipeId: string | null;
}

/** Продукт для расчётов: встроенный или собственный. */
export type AnyFood = Pick<Food, "id" | "name" | "kcal" | "protein" | "fat" | "carbs" | "source">;

function assertNotFuture(dayKey: string) {
  if (dayKey > toDayKey(new Date())) throw new DataError("Нельзя добавить приём пищи на будущий день.");
}

export const nutritionRepository = {
  /* ───────── Продукты ───────── */

  listCustomFoods(): Promise<Food[]> {
    return withDataErrors(() => getDb().foods.orderBy("name").toArray());
  },

  async getFood(id: string): Promise<AnyFood | undefined> {
    if (isBuiltinFoodId(id)) return getBuiltinFood(id);
    return withDataErrors(() => getDb().foods.get(id));
  },

  async createFood(input: FoodInput): Promise<Food> {
    return withDataErrors(async () => {
      const food = foodSchema.parse({ id: createId(), ...input, source: "custom", createdAt: Date.now() });
      await getDb().foods.add(food);
      return food;
    });
  },

  async updateFood(id: string, input: FoodInput): Promise<Food> {
    return withDataErrors(async () => {
      const db = getDb();
      const current = await db.foods.get(id);
      if (!current) throw new DataError("Продукт не найден.");
      const next = foodSchema.parse({ ...current, ...input });
      await db.foods.put(next);
      return next;
    });
  },

  /** Удаление собственного продукта. Запрещено, если он входит в блюдо. История питания не меняется. */
  async deleteFood(id: string): Promise<void> {
    return withDataErrors(async () => {
      const db = getDb();
      const usedIn = (await db.recipes.toArray()).filter((r) => r.items.some((i) => i.foodId === id));
      if (usedIn.length) {
        throw new DataError(`Продукт используется в блюдах: ${usedIn.map((r) => `«${r.name}»`).join(", ")}. Сначала уберите его из них.`);
      }
      await db.foods.delete(id);
    });
  },

  /* ───────── Блюда ───────── */

  listRecipes(): Promise<Recipe[]> {
    return withDataErrors(() => getDb().recipes.orderBy("name").toArray());
  },

  getRecipe(id: string): Promise<Recipe | undefined> {
    return withDataErrors(() => getDb().recipes.get(id));
  },

  async saveRecipe(input: RecipeInput, id?: string): Promise<Recipe> {
    return withDataErrors(async () => {
      const db = getDb();
      const now = Date.now();
      const current = id ? await db.recipes.get(id) : undefined;
      if (id && !current) throw new DataError("Блюдо не найдено.");
      for (const item of input.items) {
        if (!(await nutritionRepository.getFood(item.foodId))) throw new DataError("Один из продуктов блюда не найден.");
      }
      const recipe = recipeSchema.parse({
        id: current?.id ?? createId(),
        name: input.name,
        items: input.items,
        yieldGrams: input.yieldGrams,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
      });
      await db.recipes.put(recipe);
      return recipe;
    });
  },

  deleteRecipe(id: string): Promise<void> {
    return withDataErrors(() => getDb().recipes.delete(id));
  },

  /* ───────── Приёмы пищи ───────── */

  entriesForDay(dayKey: string): Promise<MealEntry[]> {
    return withDataErrors(() => getDb().mealEntries.where("date").equals(dayKey).sortBy("createdAt"));
  },

  entriesBetween(fromKey: string, toKey: string): Promise<MealEntry[]> {
    return withDataErrors(() => getDb().mealEntries.where("date").between(fromKey, toKey, true, true).toArray());
  },

  /** Последние добавленные записи (для списка «Недавние»). */
  recentEntries(limit = 200): Promise<MealEntry[]> {
    return withDataErrors(() => getDb().mealEntries.orderBy("date").reverse().limit(limit).toArray());
  },

  /**
   * Добавляет запись. КБЖУ рассчитывается из значений на 100 г и граммовки
   * и сохраняется в записи — изменение продукта позже не переписывает историю.
   */
  async addEntry(input: NewMealEntry): Promise<MealEntry> {
    return withDataErrors(async () => {
      assertNotFuture(input.date);
      const portion = roundMacros(macrosForPortion(input.per100, input.grams));
      const entry = mealEntrySchema.parse({
        id: createId(),
        date: input.date,
        meal: input.meal,
        title: input.title,
        grams: input.grams,
        ...portion,
        foodId: input.foodId,
        recipeId: input.recipeId,
        createdAt: Date.now(),
      });
      await getDb().mealEntries.add(entry);
      return entry;
    });
  },

  /** Изменение граммовки и/или приёма пищи с пересчётом КБЖУ. */
  async updateEntry(id: string, patch: { grams: number; meal: MealType }): Promise<MealEntry> {
    return withDataErrors(async () => {
      const db = getDb();
      const current = await db.mealEntries.get(id);
      if (!current) throw new DataError("Запись не найдена.");
      const per100 = per100FromPortion(current, current.grams);
      const next = mealEntrySchema.parse({
        ...current,
        ...roundMacros(macrosForPortion(per100, patch.grams)),
        grams: patch.grams,
        meal: patch.meal,
      });
      await db.mealEntries.put(next);
      return next;
    });
  },

  deleteEntry(id: string): Promise<void> {
    return withDataErrors(() => getDb().mealEntries.delete(id));
  },
};
