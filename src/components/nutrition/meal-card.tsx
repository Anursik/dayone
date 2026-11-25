"use client";

import { Coffee, Cookie, Moon, Plus, Sun, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import type { Macros } from "@/lib/calculations/nutrition";
import type { MealEntry, MealType } from "@/lib/db/schemas";
import { formatNumber } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { MacroLine } from "./macro-line";

const ICONS: Record<MealType, LucideIcon> = { breakfast: Coffee, lunch: Sun, dinner: Moon, snack: Cookie };

interface MealCardProps {
  meal: MealType;
  label: string;
  entries: MealEntry[];
  total: Macros;
  onAdd: () => void;
  onEdit: (entry: MealEntry) => void;
}

export function MealCard({ meal, label, entries, total, onAdd, onEdit }: MealCardProps) {
  return (
    <Card className="p-0">
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
        <IconBadge icon={ICONS[meal]} color="var(--c-nutrition)" />
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold">{label}</p>
          {entries.length ? <MacroLine macros={total} /> : <p className="text-[12.5px] text-muted-foreground">Пока ничего не добавлено</p>}
        </div>
        <span className="tabular text-[15px] font-bold">
          {formatNumber(total.kcal)} <span className="text-[12.5px] font-medium text-muted-foreground">ккал</span>
        </span>
      </div>

      {entries.length ? (
        <ul className="mx-4 divide-y divide-border border-t border-border">
          {entries.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  onEdit(e);
                }}
                className="flex w-full items-center gap-3 py-2.5 text-left active:opacity-60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium">{e.title}</span>
                  <span className="tabular text-[12.5px] text-muted-foreground">{formatNumber(e.grams)} г</span>
                </span>
                <span className="tabular text-[14px] font-semibold">{formatNumber(e.kcal)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => {
          haptics.impact("light");
          onAdd();
        }}
        aria-label={`Добавить в «${label}»`}
        className="flex w-full items-center justify-center gap-1.5 border-t border-border py-3 text-[14.5px] font-semibold text-nutrition active:bg-muted"
      >
        <Plus className="size-[18px]" />
        Добавить
      </button>
    </Card>
  );
}
