/**
 * Встроенная библиотека упражнений. Хранится в коде (работает офлайн, не попадает в резервную копию).
 * Собственные упражнения пользователя хранятся в локальной базе.
 */

export const MUSCLE_GROUPS = ["Грудь", "Спина", "Ноги", "Плечи", "Руки", "Пресс", "Всё тело"] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

type Row = [string, string, MuscleGroup];

const ROWS: Row[] = [
  ["bench-press", "Жим штанги лёжа", "Грудь"],
  ["db-bench-press", "Жим гантелей лёжа", "Грудь"],
  ["incline-bench-press", "Жим штанги на наклонной скамье", "Грудь"],
  ["incline-db-press", "Жим гантелей на наклонной скамье", "Грудь"],
  ["db-fly", "Разводка гантелей лёжа", "Грудь"],
  ["cable-crossover", "Сведение рук в кроссовере", "Грудь"],
  ["machine-chest-press", "Жим от груди в тренажёре", "Грудь"],
  ["push-ups", "Отжимания", "Грудь"],
  ["dips", "Отжимания на брусьях", "Грудь"],

  ["pull-ups", "Подтягивания", "Спина"],
  ["lat-pulldown", "Тяга верхнего блока", "Спина"],
  ["seated-cable-row", "Тяга горизонтального блока", "Спина"],
  ["barbell-row", "Тяга штанги в наклоне", "Спина"],
  ["db-row", "Тяга гантели одной рукой", "Спина"],
  ["t-bar-row", "Тяга Т-грифа", "Спина"],
  ["deadlift", "Становая тяга", "Спина"],
  ["hyperextension", "Гиперэкстензия", "Спина"],

  ["squat", "Приседания со штангой", "Ноги"],
  ["front-squat", "Фронтальные приседания", "Ноги"],
  ["leg-press", "Жим ногами", "Ноги"],
  ["lunges", "Выпады с гантелями", "Ноги"],
  ["bulgarian-split-squat", "Болгарские сплит-приседания", "Ноги"],
  ["romanian-deadlift", "Румынская тяга", "Ноги"],
  ["leg-curl", "Сгибание ног в тренажёре", "Ноги"],
  ["leg-extension", "Разгибание ног в тренажёре", "Ноги"],
  ["hip-thrust", "Ягодичный мост со штангой", "Ноги"],
  ["calf-raise", "Подъём на носки", "Ноги"],
  ["bodyweight-squat", "Приседания без веса", "Ноги"],

  ["overhead-press", "Жим штанги стоя", "Плечи"],
  ["seated-db-press", "Жим гантелей сидя", "Плечи"],
  ["lateral-raise", "Махи гантелями в стороны", "Плечи"],
  ["rear-delt-fly", "Махи гантелями в наклоне", "Плечи"],
  ["upright-row", "Тяга штанги к подбородку", "Плечи"],
  ["face-pull", "Тяга каната к лицу", "Плечи"],

  ["barbell-curl", "Подъём штанги на бицепс", "Руки"],
  ["db-curl", "Подъём гантелей на бицепс", "Руки"],
  ["hammer-curl", "Молотки с гантелями", "Руки"],
  ["french-press", "Французский жим", "Руки"],
  ["triceps-pushdown", "Разгибание рук на блоке", "Руки"],
  ["close-grip-bench", "Жим штанги узким хватом", "Руки"],

  ["crunches", "Скручивания", "Пресс"],
  ["hanging-leg-raise", "Подъём ног в висе", "Пресс"],
  ["russian-twist", "Русские скручивания", "Пресс"],
  ["ab-wheel", "Ролик для пресса", "Пресс"],

  ["kettlebell-swing", "Махи гирей", "Всё тело"],
  ["burpees", "Бёрпи", "Всё тело"],
  ["clean-and-press", "Взятие на грудь и жим", "Всё тело"],
];

export interface LibraryExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  source: "builtin";
}

export const BUILTIN_EXERCISE_PREFIX = "bx:";

export const BUILTIN_EXERCISES: LibraryExercise[] = ROWS.map(([id, name, muscleGroup]) => ({
  id: BUILTIN_EXERCISE_PREFIX + id,
  name,
  muscleGroup,
  source: "builtin",
}));

const BY_ID = new Map(BUILTIN_EXERCISES.map((e) => [e.id, e]));

export function getBuiltinExercise(id: string): LibraryExercise | undefined {
  return BY_ID.get(id);
}

export function isBuiltinExerciseId(id: string): boolean {
  return id.startsWith(BUILTIN_EXERCISE_PREFIX);
}
