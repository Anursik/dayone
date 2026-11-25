"use client";

import { Apple, BookOpen, Dumbbell, HeartPulse, ListChecks, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { haptics } from "@/lib/telegram/haptics";

interface QuickAction {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const ACTIONS: QuickAction[] = [
  { href: "/habits", label: "Привычки", icon: ListChecks, color: "var(--c-habits)" },
  { href: "/nutrition", label: "Еда", icon: Apple, color: "var(--c-nutrition)" },
  { href: "/workouts", label: "Спорт", icon: Dumbbell, color: "var(--c-workouts)" },
  { href: "/profile/health", label: "Здоровье", icon: HeartPulse, color: "var(--c-health)" },
  { href: "/profile/journal", label: "Дневник", icon: BookOpen, color: "var(--c-journal)" },
];

export function QuickActions() {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {ACTIONS.map(({ href, label, icon: Icon, color }) => (
        <Link
          key={href}
          href={href}
          onClick={() => haptics.impact("light")}
          className="flex min-w-[64px] flex-1 flex-col items-center gap-2 rounded-[20px] bg-card px-1 py-3.5 shadow-card transition-transform active:scale-95"
        >
          <span
            className="grid size-11 place-items-center rounded-full"
            style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
          >
            <Icon className="size-[22px]" strokeWidth={2.2} />
          </span>
          <span className="text-[11.5px] font-semibold tracking-tight">{label}</span>
        </Link>
      ))}
    </div>
  );
}
