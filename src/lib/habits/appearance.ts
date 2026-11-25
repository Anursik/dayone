import {
  Apple,
  Bed,
  Bike,
  BookOpen,
  Brain,
  CigaretteOff,
  Code,
  Coffee,
  Droplets,
  Dumbbell,
  Footprints,
  GraduationCap,
  Heart,
  Languages,
  Leaf,
  Moon,
  Music,
  PenLine,
  Pill,
  Salad,
  Smartphone,
  Smile,
  Sparkles,
  Sun,
  Target,
  Timer,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Иконки привычек: ключ хранится в базе, компонент выбирается при отрисовке. */
export const HABIT_ICONS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  book: BookOpen,
  study: GraduationCap,
  water: Droplets,
  sleep: Moon,
  "no-smoking": CigaretteOff,
  apple: Apple,
  steps: Footprints,
  brain: Brain,
  heart: Heart,
  sun: Sun,
  music: Music,
  pen: PenLine,
  code: Code,
  bike: Bike,
  pill: Pill,
  bed: Bed,
  salad: Salad,
  languages: Languages,
  wallet: Wallet,
  sparkles: Sparkles,
  leaf: Leaf,
  timer: Timer,
  smile: Smile,
  coffee: Coffee,
  phone: Smartphone,
  target: Target,
  zap: Zap,
};

export const HABIT_ICON_KEYS = Object.keys(HABIT_ICONS);

export function habitIcon(key: string): LucideIcon {
  return HABIT_ICONS[key] ?? Target;
}

/** Цвета привычек — ссылки на токены дизайн-системы (корректны в светлой и тёмной теме). */
export const HABIT_COLORS: Record<string, { label: string; value: string }> = {
  violet: { label: "Фиолетовый", value: "var(--c-habits)" },
  blue: { label: "Синий", value: "var(--c-workouts)" },
  sky: { label: "Голубой", value: "var(--c-water)" },
  green: { label: "Зелёный", value: "var(--c-health)" },
  orange: { label: "Оранжевый", value: "var(--c-nutrition)" },
  amber: { label: "Жёлтый", value: "var(--c-journal)" },
  pink: { label: "Розовый", value: "var(--c-analytics)" },
  indigo: { label: "Индиго", value: "var(--c-sleep)" },
};

export const HABIT_COLOR_KEYS = Object.keys(HABIT_COLORS);

export function habitColor(key: string): string {
  return HABIT_COLORS[key]?.value ?? HABIT_COLORS.violet.value;
}

export interface HabitTemplate {
  name: string;
  icon: string;
  color: string;
  days: number[];
}

/** Шаблоны-подсказки для быстрого создания. Создаются только по выбору пользователя. */
export const HABIT_TEMPLATES: HabitTemplate[] = [
  { name: "Тренировка", icon: "dumbbell", color: "blue", days: [0, 2, 4] },
  { name: "Чтение 20 минут", icon: "book", color: "amber", days: [0, 1, 2, 3, 4, 5, 6] },
  { name: "Учёба", icon: "study", color: "violet", days: [0, 1, 2, 3, 4] },
  { name: "Выпить 2 л воды", icon: "water", color: "sky", days: [0, 1, 2, 3, 4, 5, 6] },
  { name: "Сон до 23:00", icon: "sleep", color: "indigo", days: [0, 1, 2, 3, 4, 5, 6] },
  { name: "Без сигарет", icon: "no-smoking", color: "green", days: [0, 1, 2, 3, 4, 5, 6] },
];
