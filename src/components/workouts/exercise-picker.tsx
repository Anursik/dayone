"use client";

import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useWorkoutActions, type CatalogExercise, type ExerciseCatalog } from "@/features/workouts/use-workouts";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";
import { MUSCLE_GROUPS } from "@/lib/workouts/exercise-library";

function Row({ e, onPick }: { e: CatalogExercise; onPick: (e: CatalogExercise) => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptics.selection();
        onPick(e);
      }}
      className="flex w-full items-center gap-3 py-3 text-left active:opacity-60"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{e.name}</span>
        {e.muscleGroup ? <span className="text-[12.5px] text-muted-foreground">{e.muscleGroup}</span> : null}
      </span>
      <Plus className="size-[18px] text-workouts" />
    </button>
  );
}

export function ExerciseForm({ initial, submitLabel, onSaved }: { initial?: { name: string; muscleGroup: string | null; id?: string }; submitLabel: string; onSaved: (e: CatalogExercise) => void }) {
  const { saveExercise } = useWorkoutActions();
  const [name, setName] = useState(initial?.name ?? "");
  const [group, setGroup] = useState<string | null>(initial?.muscleGroup ?? null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const error = name.trim() ? null : "Введите название";

  return (
    <form
      className="space-y-4 pb-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (error) return haptics.notify("error");
        setBusy(true);
        const saved = await saveExercise({ name: name.trim(), muscleGroup: group }, initial?.id);
        setBusy(false);
        if (saved) onSaved({ id: saved.id, name: saved.name, muscleGroup: saved.muscleGroup, source: "custom" });
      }}
    >
      <FormField label="Название упражнения" maxLength={80} value={name} error={submitted ? error : null} onChange={(e) => setName(e.target.value)} />
      <div>
        <p className="mb-2 px-1 text-[13px] font-medium text-muted-foreground">Группа мышц</p>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => {
                haptics.selection();
                setGroup(group === g ? null : g);
              }}
              className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-semibold", group === g ? "bg-workouts text-white" : "bg-muted")}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" size="lg" disabled={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}

/** Выбор упражнения из библиотеки с поиском и созданием своего. */
export function ExercisePicker({ catalog, onPick }: { catalog: ExerciseCatalog; onPick: (e: CatalogExercise) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(catalog.custom.length ? "Мои упражнения" : null);
  const [creating, setCreating] = useState(false);
  const q = query.trim();

  if (creating) {
    return (
      <>
        <button type="button" onClick={() => setCreating(false)} className="-ml-1 mb-2 inline-flex items-center gap-0.5 text-[14.5px] font-medium text-muted-foreground">
          <ChevronLeft className="size-5" />К списку
        </button>
        <ExerciseForm initial={{ name: q, muscleGroup: null }} submitLabel="Сохранить и выбрать" onSaved={onPick} />
      </>
    );
  }

  const results = q ? catalog.search(q) : null;

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 bg-elevated px-5 pb-2">
        <div className="flex h-12 items-center gap-2 rounded-2xl bg-muted px-3.5 focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-[18px] text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск упражнения"
            aria-label="Поиск упражнения"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-subtle-foreground [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button type="button" aria-label="Очистить поиск" onClick={() => setQuery("")} className="text-muted-foreground">
              <X className="size-[18px]" />
            </button>
          ) : null}
        </div>
      </div>

      {results ? (
        results.length ? (
          <div className="divide-y divide-border">
            {results.map((e) => (
              <Row key={e.id} e={e} onPick={onPick} />
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-[14px] text-muted-foreground">Ничего не найдено</p>
        )
      ) : (
        catalog.groups.map(([group, items]) => (
          <div key={group} className="border-b border-border last:border-0">
            <button
              type="button"
              aria-expanded={open === group}
              onClick={() => {
                haptics.selection();
                setOpen(open === group ? null : group);
              }}
              className="flex w-full items-center justify-between py-3 text-left text-[15px] font-medium"
            >
              {group}
              <span className="flex items-center gap-1 text-[13px] text-muted-foreground">
                {items.length}
                <ChevronRight className={cn("size-4 transition-transform", open === group && "rotate-90")} />
              </span>
            </button>
            {open === group ? (
              <div className="divide-y divide-border pb-2">
                {items.map((e) => (
                  <Row key={e.id} e={e} onPick={onPick} />
                ))}
              </div>
            ) : null}
          </div>
        ))
      )}

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="mt-2 mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-[14.5px] font-semibold text-muted-foreground active:bg-muted"
      >
        <Plus className="size-[18px]" />
        {q ? `Создать упражнение «${q}»` : "Создать своё упражнение"}
      </button>
    </div>
  );
}
