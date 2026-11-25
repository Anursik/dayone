"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { Sheet } from "@/components/ui/sheet";
import { useExerciseCatalog } from "@/features/workouts/use-workouts";
import { normalizeText } from "@/lib/nutrition/search";
import { haptics } from "@/lib/telegram/haptics";
import { ExerciseForm } from "./exercise-picker";

export function ExercisesScreen() {
  const catalog = useExerciseCatalog();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <>
      <PageHeader
        title="Упражнения"
        subtitle="Рекорды и прогресс"
        backHref="/workouts/"
        action={
          <Button size="icon" aria-label="Новое упражнение" className="mb-1" onClick={() => setCreating(true)}>
            <Plus className="size-5" />
          </Button>
        }
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск упражнения"
        aria-label="Поиск упражнения"
        className="mb-1 h-12 w-full rounded-2xl bg-card px-4 text-[16px] shadow-card outline-none focus:ring-2 focus:ring-ring"
      />
      {!catalog ? (
        <div className="min-h-[40dvh]" aria-busy="true" />
      ) : (
        (query.trim() ? [["Результаты", catalog.search(query)] as const] : catalog.groups).map(([group, items]) =>
          items.length ? (
            <div key={group}>
              <SectionTitle>{group}</SectionTitle>
              <Card className="p-0">
                <ul className="divide-y divide-border">
                  {items.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/workouts/exercise/?id=${encodeURIComponent(e.id)}`}
                        onClick={() => haptics.selection()}
                        className="flex items-center gap-3 px-4 py-3 active:bg-muted"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">{e.name}</span>
                          {query.trim() && e.muscleGroup ? <span className="text-[12.5px] text-muted-foreground">{e.muscleGroup}</span> : null}
                        </span>
                        <ChevronRight className="size-[18px] text-subtle-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : normalizeText(query) ? (
            <p key={group} className="py-6 text-center text-[14px] text-muted-foreground">
              Ничего не найдено
            </p>
          ) : null,
        )
      )}

      <Sheet open={creating} onOpenChange={setCreating} title="Новое упражнение">
        {creating ? <ExerciseForm submitLabel="Добавить" onSaved={() => setCreating(false)} /> : null}
      </Sheet>
    </>
  );
}
