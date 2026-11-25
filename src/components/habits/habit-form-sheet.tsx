"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Sheet } from "@/components/ui/sheet";
import { useHabitActions } from "@/features/habits/use-habits";
import { ALL_DAYS, DAY_SHORT, WEEKDAYS, WEEKENDS } from "@/lib/calculations/habits";
import type { Habit } from "@/lib/db/schemas";
import {
  HABIT_COLORS,
  HABIT_COLOR_KEYS,
  HABIT_ICON_KEYS,
  HABIT_TEMPLATES,
  habitColor,
  type HabitTemplate,
} from "@/lib/habits/appearance";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";
import { HabitGlyph } from "./habit-glyph";

interface HabitFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Если передана — режим редактирования */
  habit?: Habit;
}

interface FormState {
  name: string;
  icon: string;
  color: string;
  days: number[];
}

const EMPTY: FormState = { name: "", icon: "target", color: "violet", days: ALL_DAYS };

const PRESETS: { label: string; days: number[] }[] = [
  { label: "Каждый день", days: ALL_DAYS },
  { label: "Будни", days: WEEKDAYS },
  { label: "Выходные", days: WEEKENDS },
];

function sameDays(a: number[], b: number[]) {
  return [...a].sort().join() === [...b].sort().join();
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">{children}</p>;
}

function HabitForm({ habit, onDone }: { habit?: Habit; onDone: () => void }) {
  const { create, update } = useHabitActions();
  const [form, setForm] = useState<FormState>(() =>
    habit ? { name: habit.name, icon: habit.icon, color: habit.color, days: habit.schedule.days } : EMPTY,
  );
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const nameError = !form.name.trim() ? "Введите название" : form.name.trim().length > 60 ? "Не больше 60 символов" : null;
  const daysError = form.days.length === 0 ? "Выберите хотя бы один день" : null;
  const color = habitColor(form.color);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const applyTemplate = (t: HabitTemplate) => {
    haptics.selection();
    setForm({ name: t.name, icon: t.icon, color: t.color, days: t.days });
  };

  const toggleDay = (day: number) => {
    haptics.selection();
    set({ days: form.days.includes(day) ? form.days.filter((d) => d !== day) : [...form.days, day] });
  };

  const submit = async () => {
    setSubmitted(true);
    if (nameError || daysError) {
      haptics.notify("error");
      return;
    }
    setBusy(true);
    const input = { name: form.name.trim(), icon: form.icon, color: form.color, days: form.days };
    const result = habit ? await update(habit.id, input) : await create(input);
    setBusy(false);
    if (result) onDone();
  };

  return (
    <form
      className="space-y-5 pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {!habit ? (
        <div>
          <Label>Быстрый старт</Label>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {HABIT_TEMPLATES.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => applyTemplate(t)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted py-2 pr-3.5 pl-2.5 text-[13.5px] font-semibold active:scale-95"
              >
                <HabitGlyph icon={t.icon} className="size-4" style={{ color: habitColor(t.color) }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-end gap-3">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-2xl"
          style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
          aria-hidden
        >
          <HabitGlyph icon={form.icon} className="size-6" strokeWidth={2.2} />
        </span>
        <FormField
          className="flex-1"
          label="Название"
          placeholder="Например, «Зарядка»"
          maxLength={60}
          value={form.name}
          error={submitted ? nameError : null}
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>

      <div>
        <Label>Иконка</Label>
        <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label="Иконка">
          {HABIT_ICON_KEYS.map((key) => {
            const active = form.icon === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={key}
                onClick={() => {
                  haptics.selection();
                  set({ icon: key });
                }}
                className={cn(
                  "grid aspect-square place-items-center rounded-xl transition-colors",
                  active ? "text-white" : "bg-muted text-muted-foreground",
                )}
                style={active ? { backgroundColor: color } : undefined}
              >
                <HabitGlyph icon={key} className="size-5" />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Цвет</Label>
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Цвет">
          {HABIT_COLOR_KEYS.map((key) => {
            const active = form.color === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={HABIT_COLORS[key].label}
                onClick={() => {
                  haptics.selection();
                  set({ color: key });
                }}
                className="grid size-9 place-items-center rounded-full transition-transform active:scale-90"
                style={{ backgroundColor: HABIT_COLORS[key].value }}
              >
                {active ? <Check className="size-[18px] text-white" strokeWidth={3} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Расписание</Label>
        <div className="mb-2.5 flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                haptics.selection();
                set({ days: p.days });
              }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                sameDays(form.days, p.days) ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Дни недели">
          {DAY_SHORT.map((label, day) => {
            const active = form.days.includes(day);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => toggleDay(day)}
                className={cn(
                  "h-10 rounded-xl text-[13px] font-bold transition-colors",
                  active ? "text-white" : "bg-muted text-muted-foreground",
                )}
                style={active ? { backgroundColor: color } : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>
        {submitted && daysError ? <p className="mt-1.5 px-1 text-[12.5px] text-destructive">{daysError}</p> : null}
      </div>

      <Button type="submit" size="lg" disabled={busy}>
        {habit ? "Сохранить" : "Создать привычку"}
      </Button>
    </form>
  );
}

export function HabitFormSheet({ open, onOpenChange, habit }: HabitFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={habit ? "Редактировать привычку" : "Новая привычка"}>
      {/* key пересоздаёт форму при каждом открытии — без остатков прошлого ввода */}
      {open ? <HabitForm key={habit?.id ?? "new"} habit={habit} onDone={() => onOpenChange(false)} /> : null}
    </Sheet>
  );
}
