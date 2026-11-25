"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useMemo } from "react";
import { recipeNutrition, sumMacros, ZERO_MACROS, type Macros } from "@/lib/calculations/nutrition";
import { toDataError } from "@/lib/db/errors";
import type { Food, MealEntry, MealType, Recipe } from "@/lib/db/schemas";
import { BUILTIN_FOODS, getBuiltinFood, type FoodCategory } from "@/lib/nutrition/food-database";
import { searchByName } from "@/lib/nutrition/search";
import { shiftDayKey } from "@/lib/date";
import {
  nutritionRepository,
  profileRepository,
  type FoodInput,
  type NewMealEntry,
  type RecipeInput,
} from "@/lib/repositories";
import { haptics } from "@/lib/telegram/haptics";
import { toast } from "@/lib/toast";
import type { DashboardSummary } from "@/types/dashboard";

export const MEALS: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Завтрак" },
  { key: "lunch", label: "Обед" },
  { key: "dinner", label: "Ужин" },
  { key: "snack", label: "Перекусы" },
];

export const MEAL_LABEL: Record<MealType, string> = Object.fromEntries(MEALS.map((m) => [m.key, m.label])) as Record<MealType, string>;

/** Приём пищи по умолчанию — по времени суток. */
export function defaultMealForNow(date = new Date()): MealType {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 22) return "dinner";
  return "snack";
}

const toMacros = (f: Macros): Macros => ({ kcal: f.kcal, protein: f.protein, fat: f.fat, carbs: f.carbs });

/* ───────── День ───────── */

export interface NutritionDay {
  byMeal: Record<MealType, MealEntry[]>;
  mealTotals: Record<MealType, Macros>;
  total: Macros;
  overview: DashboardSummary["nutrition"];
  count: number;
}

export function useNutritionDay(dayKey: string | null): NutritionDay | undefined {
  const data = useLiveQuery(async () => {
    if (!dayKey) return undefined;
    const [entries, profile] = await Promise.all([nutritionRepository.entriesForDay(dayKey), profileRepository.get()]);
    return { entries, goals: profile?.goals ?? null };
  }, [dayKey]);

  return useMemo(() => {
    if (!data) return undefined;
    const byMeal = { breakfast: [], lunch: [], dinner: [], snack: [] } as Record<MealType, MealEntry[]>;
    for (const e of data.entries) byMeal[e.meal].push(e);
    const mealTotals = Object.fromEntries(MEALS.map((m) => [m.key, sumMacros(byMeal[m.key])])) as Record<MealType, Macros>;
    const total = sumMacros(data.entries);
    const g = data.goals;
    return {
      byMeal,
      mealTotals,
      total,
      count: data.entries.length,
      overview: {
        calories: total.kcal,
        caloriesGoal: g?.caloriesKcal ?? null,
        protein: { eaten: total.protein, goal: g?.proteinG ?? null },
        fat: { eaten: total.fat, goal: g?.fatG ?? null },
        carbs: { eaten: total.carbs, goal: g?.carbsG ?? null },
      },
    };
  }, [data]);
}

/* ───────── Каталог: продукты, блюда, недавние ───────── */

export type CatalogItem =
  | { kind: "food"; id: string; name: string; per100: Macros; source: "builtin" | "custom"; category?: FoodCategory }
  | { kind: "recipe"; id: string; name: string; per100: Macros; yieldWeight: number; ingredients: number; missing: number };

function foodItem(f: Pick<Food, "id" | "name" | "kcal" | "protein" | "fat" | "carbs" | "source"> & { category?: FoodCategory }): CatalogItem {
  return { kind: "food", id: f.id, name: f.name, per100: toMacros(f), source: f.source, category: f.category };
}

function recipeItem(r: Recipe, customById: Map<string, Food>): CatalogItem {
  let missing = 0;
  const ingredients = r.items.flatMap((i) => {
    const f = getBuiltinFood(i.foodId) ?? customById.get(i.foodId);
    if (!f) {
      missing++;
      return [];
    }
    return [{ per100: toMacros(f), grams: i.grams }];
  });
  const n = recipeNutrition(ingredients, r.yieldGrams);
  return { kind: "recipe", id: r.id, name: r.name, per100: n.per100, yieldWeight: n.yieldWeight, ingredients: r.items.length, missing };
}

export interface Catalog {
  customFoods: Food[];
  recipes: Recipe[];
  customItems: CatalogItem[];
  recipeItems: CatalogItem[];
  recent: CatalogItem[];
  find: (kind: "food" | "recipe", id: string) => CatalogItem | undefined;
  search: (query: string) => { recipes: CatalogItem[]; custom: CatalogItem[]; builtin: CatalogItem[] };
}

const BUILTIN_ITEMS = BUILTIN_FOODS.map(foodItem);

export function useCatalog(): Catalog | undefined {
  const data = useLiveQuery(async () => {
    const [customFoods, recipes, recentEntries] = await Promise.all([
      nutritionRepository.listCustomFoods(),
      nutritionRepository.listRecipes(),
      nutritionRepository.recentEntries(),
    ]);
    return { customFoods, recipes, recentEntries };
  }, []);

  return useMemo(() => {
    if (!data) return undefined;
    const customById = new Map(data.customFoods.map((f) => [f.id, f]));
    const customItems = data.customFoods.map(foodItem);
    const recipeItems = data.recipes.map((r) => recipeItem(r, customById));
    const recipeById = new Map(recipeItems.map((r) => [r.id, r]));

    const find = (kind: "food" | "recipe", id: string) => {
      if (kind === "recipe") return recipeById.get(id);
      const builtin = getBuiltinFood(id);
      if (builtin) return foodItem(builtin);
      const custom = customById.get(id);
      return custom ? foodItem(custom) : undefined;
    };

    // Недавние: уникальные продукты/блюда из последних записей, только существующие
    const seen = new Set<string>();
    const recent: CatalogItem[] = [];
    const sorted = [...data.recentEntries].sort((a, b) => b.createdAt - a.createdAt);
    for (const e of sorted) {
      const key = e.recipeId ? `r:${e.recipeId}` : e.foodId ? `f:${e.foodId}` : null;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const item = e.recipeId ? find("recipe", e.recipeId) : find("food", e.foodId!);
      if (item) recent.push(item);
      if (recent.length >= 12) break;
    }

    return {
      customFoods: data.customFoods,
      recipes: data.recipes,
      customItems,
      recipeItems,
      recent,
      find,
      search: (query: string) => ({
        recipes: searchByName(recipeItems, query, 20),
        custom: searchByName(customItems, query, 30),
        builtin: searchByName(BUILTIN_ITEMS, query, 40),
      }),
    };
  }, [data]);
}

export function getBuiltinCatalog(): CatalogItem[] {
  return BUILTIN_ITEMS;
}

/* ───────── История ───────── */

export interface HistoryDay {
  key: string;
  kcal: number;
  count: number;
}

export function useNutritionHistory(todayKey: string | null, days = 7) {
  const data = useLiveQuery(async () => {
    if (!todayKey) return undefined;
    const from = shiftDayKey(todayKey, -(days - 1));
    const [entries, profile] = await Promise.all([nutritionRepository.entriesBetween(from, todayKey), profileRepository.get()]);
    return { entries, from, goal: profile?.goals.caloriesKcal ?? null };
  }, [todayKey, days]);

  return useMemo(() => {
    if (!data || !todayKey) return undefined;
    const list: HistoryDay[] = Array.from({ length: days }, (_, i) => ({ key: shiftDayKey(data.from, i), kcal: 0, count: 0 }));
    const index = new Map(list.map((d) => [d.key, d]));
    for (const e of data.entries) {
      const d = index.get(e.date);
      if (d) {
        d.kcal += e.kcal;
        d.count++;
      }
    }
    const logged = list.filter((d) => d.count > 0);
    const average = logged.length ? logged.reduce((s, d) => s + d.kcal, 0) / logged.length : null;
    return { days: list, average, loggedDays: logged.length, goal: data.goal };
  }, [data, todayKey, days]);
}

/* ───────── Действия ───────── */

function fail(error: unknown) {
  haptics.notify("error");
  toast(toDataError(error).userMessage, "error");
}

async function run<T>(fn: () => Promise<T>, success?: string): Promise<T | null> {
  try {
    const result = await fn();
    haptics.notify("success");
    if (success) toast(success, "success");
    return result;
  } catch (error) {
    fail(error);
    return null;
  }
}

export function useNutritionActions() {
  return {
    addEntry: useCallback((input: NewMealEntry) => run(() => nutritionRepository.addEntry(input), `Добавлено: ${MEAL_LABEL[input.meal].toLowerCase()}`), []),
    updateEntry: useCallback((id: string, patch: { grams: number; meal: MealType }) => run(() => nutritionRepository.updateEntry(id, patch), "Запись обновлена"), []),
    deleteEntry: useCallback((id: string) => run(() => nutritionRepository.deleteEntry(id).then(() => true), "Запись удалена"), []),
    createFood: useCallback((input: FoodInput) => run(() => nutritionRepository.createFood(input), "Продукт добавлен в базу"), []),
    updateFood: useCallback((id: string, input: FoodInput) => run(() => nutritionRepository.updateFood(id, input), "Продукт обновлён"), []),
    deleteFood: useCallback((id: string) => run(() => nutritionRepository.deleteFood(id).then(() => true), "Продукт удалён"), []),
    saveRecipe: useCallback((input: RecipeInput, id?: string) => run(() => nutritionRepository.saveRecipe(input, id), id ? "Блюдо обновлено" : "Блюдо создано"), []),
    deleteRecipe: useCallback((id: string) => run(() => nutritionRepository.deleteRecipe(id).then(() => true), "Блюдо удалено"), []),
  };
}

export { ZERO_MACROS };
