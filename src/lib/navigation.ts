import {
  Apple,
  BarChart3,
  BookOpen,
  Dumbbell,
  HeartPulse,
  House,
  ListChecks,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Нижняя навигация (5 вкладок). */
export const TABS: NavItem[] = [
  { href: "/", label: "Главная", icon: House },
  { href: "/habits", label: "Привычки", icon: ListChecks },
  { href: "/nutrition", label: "Питание", icon: Apple },
  { href: "/workouts", label: "Тренировки", icon: Dumbbell },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

export interface ProfileSection extends NavItem {
  description: string;
  /** CSS-переменная акцентного цвета раздела */
  color: string;
}

/** Разделы внутри профиля. */
export const PROFILE_SECTIONS: ProfileSection[] = [
  {
    href: "/profile/health",
    label: "Здоровье",
    description: "Вес, вода, сон, шаги, замеры",
    icon: HeartPulse,
    color: "var(--c-health)",
  },
  {
    href: "/profile/journal",
    label: "Дневник",
    description: "Записи, настроение, оценка дня",
    icon: BookOpen,
    color: "var(--c-journal)",
  },
  {
    href: "/profile/analytics",
    label: "Статистика",
    description: "Графики и общий прогресс",
    icon: BarChart3,
    color: "var(--c-analytics)",
  },
  {
    href: "/profile/settings",
    label: "Настройки",
    description: "Профиль, тема, экспорт и импорт",
    icon: Settings,
    color: "var(--muted-foreground)",
  },
];

export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

/** Активная вкладка для текущего пути (вложенные экраны профиля относятся к «Профилю»). */
export function getActiveTab(pathname: string): string {
  const path = normalizePath(pathname);
  if (path === "/") return "/";
  const match = TABS.filter((t) => t.href !== "/").find((t) => path === t.href || path.startsWith(`${t.href}/`));
  return match?.href ?? "/";
}

/** Родительский экран для кнопки «Назад» или null, если экран корневой. */
export function getParentPath(pathname: string): string | null {
  const path = normalizePath(pathname);
  if (path.startsWith("/profile/")) return "/profile";
  if (path.startsWith("/habits/")) return "/habits";
  if (path.startsWith("/nutrition/")) return "/nutrition";
  return null;
}
