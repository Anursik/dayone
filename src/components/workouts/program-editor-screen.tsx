"use client";

import { ArrowDown, ArrowUp, Plus, SearchX, Trash2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { useExerciseCatalog, useProgram, useWorkoutActions, type ExerciseCatalog } from "@/features/workouts/use-workouts";
import type { WorkoutProgram } from "@/lib/db/schemas";
import { haptics } from "@/lib/telegram/haptics";
import { ExercisePicker } from "./exercise-picker";

interface Item {
  key: number;
  exerciseId: string;
  sets: number;
  reps: number;
  weightKg: number;
  restSec: number;
}

const kg = (v: number) => (v === 0 ? "—" : String(v).replace(".", ","));
const rest = (v: number) => (v < 60 ? `${v} с` : `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`);

function ProgramEditor({ program, catalog }: { program: WorkoutProgram | null; catalog: ExerciseCatalog }) {
  const router = useRouter();
  const { saveProgram, deleteProgram } = useWorkoutActions();
  const [name, setName] = useState(program?.name ?? "");
  const [items, setItems] = useState<Item[]>(() =>
    (program?.items ?? []).map((i, idx) => ({ key: idx, exerciseId: i.exerciseId, sets: i.sets, reps: i.reps, weightKg: i.weightKg ?? 0, restSec: i.restSec })),
  );
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const nameError = name.trim() ? null : "Введите название";
  const itemsError = items.length ? null : "Добавьте хотя бы одно упражнение";

  const update = (key: number, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const move = (index: number, delta: number) => {
    haptics.selection();
    setItems((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  };

  const save = async () => {
    setSubmitted(true);
    if (nameError || itemsError) return haptics.notify("error");
    setBusy(true);
    const saved = await saveProgram(
      {
        name: name.trim(),
        items: items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, reps: i.reps, weightKg: i.weightKg > 0 ? i.weightKg : null, restSec: i.restSec })),
      },
      program?.id,
    );
    setBusy(false);
    if (saved) router.replace("/workouts/");
  };

  return (
    <>
      <PageHeader title={program ? "Программа" : "Новая программа"} backHref="/workouts/" />
      <FormField label="Название" maxLength={80} placeholder="Например, «Верх тела»" value={name} error={submitted ? nameError : null} onChange={(e) => setName(e.target.value)} />

      <div className="mt-5 space-y-2.5">
        {items.map((item, index) => (
          <Card key={item.key} className="p-3.5">
            <div className="mb-3 flex items-center gap-2">
              <span className="tabular grid size-7 shrink-0 place-items-center rounded-full bg-workouts/15 text-[13px] font-bold text-workouts">{index + 1}</span>
              <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">{catalog.name(item.exerciseId)}</p>
              <button type="button" aria-label="Выше" disabled={index === 0} onClick={() => move(index, -1)} className="grid size-8 place-items-center rounded-full text-muted-foreground disabled:opacity-25">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" aria-label="Ниже" disabled={index === items.length - 1} onClick={() => move(index, 1)} className="grid size-8 place-items-center rounded-full text-muted-foreground disabled:opacity-25">
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Убрать «${catalog.name(item.exerciseId)}»`}
                onClick={() => {
                  haptics.selection();
                  setItems((list) => list.filter((i) => i.key !== item.key));
                }}
                className="grid size-8 place-items-center rounded-full text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Stepper label="Подходы" value={item.sets} min={1} max={20} onChange={(v) => update(item.key, { sets: v })} />
              <Stepper label="Повторы" value={item.reps} min={1} max={100} onChange={(v) => update(item.key, { reps: v })} />
              <Stepper label="Вес, кг" value={item.weightKg} step={2.5} min={0} max={500} format={kg} onChange={(v) => update(item.key, { weightKg: v })} />
              <Stepper label="Отдых" value={item.restSec} step={15} min={0} max={600} format={rest} onChange={(v) => update(item.key, { restSec: v })} />
            </div>
          </Card>
        ))}
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-4 text-[15px] font-semibold text-workouts active:bg-muted"
        >
          <Plus className="size-[18px]" />
          Добавить упражнение
        </button>
        {submitted && itemsError ? <p className="px-1 text-[12.5px] text-destructive">{itemsError}</p> : null}
      </div>

      <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-muted-foreground">
        Вес — стартовый. При следующих тренировках подставляется вес из прошлого раза.
      </p>

      <div className="mt-4 space-y-2.5">
        <Button size="lg" disabled={busy} onClick={save}>
          {program ? "Сохранить программу" : "Создать программу"}
        </Button>
        {program ? (
          <Button size="lg" variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 />
            Удалить программу
          </Button>
        ) : null}
      </div>

      <Sheet open={picking} onOpenChange={setPicking} title="Добавить упражнение" className="h-[88dvh]">
        {picking ? (
          <ExercisePicker
            catalog={catalog}
            onPick={(e) => {
              setItems((list) => [...list, { key: Date.now(), exerciseId: e.id, sets: 3, reps: 10, weightKg: 0, restSec: 90 }]);
              setPicking(false);
            }}
          />
        ) : null}
      </Sheet>
      <Sheet open={confirmDelete} onOpenChange={setConfirmDelete} title="Удалить программу?">
        <div className="space-y-2.5 pb-2">
          <p className="text-[14.5px] text-muted-foreground">История тренировок по этой программе сохранится.</p>
          <Button
            size="lg"
            variant="destructive"
            onClick={async () => {
              if (program && (await deleteProgram(program.id))) router.replace("/workouts/");
            }}
          >
            <Trash2 />
            Удалить
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setConfirmDelete(false)}>
            Отмена
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export function ProgramEditorScreen() {
  const id = useSearchParams().get("id");
  const isNew = !id || id === "new";
  const program = useProgram(isNew ? null : id);
  const catalog = useExerciseCatalog();

  if (!catalog || program === undefined) return <div className="min-h-[60dvh]" aria-busy="true" />;
  if (!isNew && program === null) {
    return (
      <>
        <PageHeader title="Программа" backHref="/workouts/" />
        <EmptyState icon={SearchX} color="var(--muted-foreground)" title="Программа не найдена" />
      </>
    );
  }
  return <ProgramEditor key={program?.id ?? "new"} program={program} catalog={catalog} />;
}
