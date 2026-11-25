import type { Goals, Profile } from "@/lib/db/schemas";
import type { ProfilePatch } from "@/lib/repositories/profile-repository";

/** Описание числовых полей профиля: диапазоны, единицы и преобразование для хранения. */
export interface NumericFieldDef {
  key: string;
  label: string;
  suffix: string;
  min: number;
  max: number;
  /** Сколько знаков после запятой допускается */
  decimals: number;
  placeholder?: string;
  read: (p: Profile) => number | null;
  /** Значение из формы → патч профиля */
  write: (value: number | null) => ProfilePatch;
}

const goal = (key: keyof Goals) => ({
  read: (p: Profile) => p.goals[key],
  write: (value: number | null): ProfilePatch => ({ goals: { [key]: value } }),
});

export const BODY_FIELDS: NumericFieldDef[] = [
  { key: "age", label: "Возраст", suffix: "лет", min: 5, max: 120, decimals: 0, read: (p) => p.age, write: (v) => ({ age: v }) },
  { key: "heightCm", label: "Рост", suffix: "см", min: 50, max: 260, decimals: 1, read: (p) => p.heightCm, write: (v) => ({ heightCm: v }) },
  { key: "weightKg", label: "Вес", suffix: "кг", min: 20, max: 400, decimals: 1, read: (p) => p.weightKg, write: (v) => ({ weightKg: v }) },
];

export const NUTRITION_GOAL_FIELDS: NumericFieldDef[] = [
  { key: "caloriesKcal", label: "Калории", suffix: "ккал", min: 0, max: 10000, decimals: 0, placeholder: "2200", ...goal("caloriesKcal") },
  { key: "proteinG", label: "Белки", suffix: "г", min: 0, max: 1000, decimals: 0, placeholder: "120", ...goal("proteinG") },
  { key: "fatG", label: "Жиры", suffix: "г", min: 0, max: 1000, decimals: 0, placeholder: "70", ...goal("fatG") },
  { key: "carbsG", label: "Углеводы", suffix: "г", min: 0, max: 2000, decimals: 0, placeholder: "250", ...goal("carbsG") },
];

export const DAILY_GOAL_FIELDS: NumericFieldDef[] = [
  { key: "waterMl", label: "Вода", suffix: "мл", min: 0, max: 10000, decimals: 0, placeholder: "2000", ...goal("waterMl") },
  {
    key: "sleepHours",
    label: "Сон",
    suffix: "ч",
    min: 0,
    max: 24,
    decimals: 1,
    placeholder: "8",
    read: (p) => (p.goals.sleepMinutes === null ? null : Math.round((p.goals.sleepMinutes / 60) * 10) / 10),
    write: (v) => ({ goals: { sleepMinutes: v === null ? null : Math.round(v * 60) } }),
  },
  { key: "stepsTarget", label: "Шаги", suffix: "шагов", min: 0, max: 100000, decimals: 0, placeholder: "8000", ...goal("stepsTarget") },
  { key: "targetWeightKg", label: "Целевой вес", suffix: "кг", min: 20, max: 400, decimals: 1, ...goal("targetWeightKg") },
];

export const ALL_NUMERIC_FIELDS = [...BODY_FIELDS, ...NUTRITION_GOAL_FIELDS, ...DAILY_GOAL_FIELDS];

export type FieldResult = { ok: true; value: number | null } | { ok: false; error: string };

/** Разбор числа из поля ввода: допускается запятая, пустое поле — «не задано». */
export function parseNumericField(raw: string, def: NumericFieldDef): FieldResult {
  const text = raw.trim().replace(",", ".").replace(/\s/g, "");
  if (text === "") return { ok: true, value: null };
  if (!/^\d+(\.\d+)?$/.test(text)) return { ok: false, error: "Введите число" };
  const value = Number(text);
  if (value < def.min || value > def.max) return { ok: false, error: `От ${def.min} до ${def.max}` };
  const factor = 10 ** def.decimals;
  return { ok: true, value: Math.round(value * factor) / factor };
}

export function formatFieldValue(value: number | null): string {
  return value === null ? "" : String(value).replace(".", ",");
}

export function initialDraft(profile: Profile): Record<string, string> {
  const draft: Record<string, string> = { name: profile.name };
  for (const def of ALL_NUMERIC_FIELDS) draft[def.key] = formatFieldValue(def.read(profile));
  return draft;
}

/** Патч из всех корректных полей и ошибки некорректных (они не сохраняются). */
export function buildPatch(draft: Record<string, string>): { patch: ProfilePatch; errors: Record<string, string> } {
  const patch: ProfilePatch = { name: draft.name.trim().slice(0, 60), goals: {} };
  const errors: Record<string, string> = {};
  for (const def of ALL_NUMERIC_FIELDS) {
    const result = parseNumericField(draft[def.key] ?? "", def);
    if (!result.ok) {
      errors[def.key] = result.error;
      continue;
    }
    const part = def.write(result.value);
    Object.assign(patch, { ...part, goals: { ...patch.goals, ...part.goals } });
  }
  return { patch, errors };
}

/** Калорийность по БЖУ: 4 ккал/г белков и углеводов, 9 ккал/г жиров. */
export function caloriesFromMacros(protein: number | null, fat: number | null, carbs: number | null): number | null {
  if (protein === null || fat === null || carbs === null) return null;
  return Math.round(protein * 4 + fat * 9 + carbs * 4);
}
