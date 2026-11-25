"use client";

import { Flame } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { describeSchedule } from "@/lib/calculations/habits";
import type { Habit } from "@/lib/db/schemas";
import { plural } from "@/lib/format";
import { habitColor, habitIcon } from "@/lib/habits/appearance";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";
import { CheckButton } from "./check-button";

interface HabitCardProps {
  habit: Habit;
  streak: number;
  done?: boolean;
  /** Без кнопки отметки (привычка не запланирована на выбранный день) */
  onToggle?: () => Promise<unknown>;
}

export function HabitCard({ habit, streak, done = false, onToggle }: HabitCardProps) {
  const [busy, setBusy] = useState(false);
  const color = habitColor(habit.color);

  const toggle = async () => {
    if (!onToggle || busy) return;
    setBusy(true);
    try {
      await onToggle();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cn("flex items-center gap-3 py-3 pr-3 transition-opacity", !onToggle && "opacity-60")}>
      <Link
        href={`/habits/view/?id=${encodeURIComponent(habit.id)}`}
        onClick={() => haptics.selection()}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <IconBadge icon={habitIcon(habit.icon)} color={color} />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[15.5px] font-semibold", done && "text-muted-foreground line-through decoration-2")}>
            {habit.name}
          </span>
          <span className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            {streak > 0 ? (
              <span className="inline-flex items-center gap-0.5 font-semibold text-nutrition">
                <Flame className="size-3.5" />
                {streak} {plural(streak, ["день", "дня", "дней"])}
              </span>
            ) : null}
            <span className="truncate">{describeSchedule(habit.schedule.days)}</span>
          </span>
        </span>
      </Link>
      {onToggle ? (
        <CheckButton
          checked={done}
          color={color}
          disabled={busy}
          label={done ? `Снять отметку «${habit.name}»` : `Отметить «${habit.name}»`}
          onToggle={toggle}
        />
      ) : null}
    </Card>
  );
}
