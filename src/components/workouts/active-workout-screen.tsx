"use client";

import { Check, Dumbbell, Flag, Minus, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { parseDecimal } from "@/features/nutrition/number-input";
import { useActiveSession, useExerciseCatalog, useWorkoutActions, type ExerciseCatalog } from "@/features/workouts/use-workouts";
import { useAutosave } from "@/hooks/use-autosave";
import { formatClock, volume } from "@/lib/calculations/workouts";
import type { WorkoutSession } from "@/lib/db/schemas";
import { formatNumber, plural } from "@/lib/format";
import type { SessionSet } from "@/lib/repositories";
import { haptics } from "@/lib/telegram/haptics";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ExercisePicker } from "./exercise-picker";
import { RestTimerBar, useRestTimer } from "./rest-timer";

interface DraftSet {
  uid: number;
  exerciseId: string;
  weight: string;
  reps: string;
  completedAt: number | null;
  restSec: number;
}

let uidCounter = 1;
const fmtKg = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));

function toDraft(s: SessionSet): DraftSet {
  return { uid: uidCounter++, exerciseId: s.exerciseId, weight: fmtKg(s.weightKg), reps: s.reps ? String(s.reps) : "", completedAt: s.completedAt, restSec: s.restSec };
}

function toSet(d: DraftSet): SessionSet {
  const w = parseDecimal(d.weight);
  const r = Number.parseInt(d.reps, 10);
  return {
    exerciseId: d.exerciseId,
    weightKg: w !== null && w <= 1000 ? w : null,
    reps: Number.isFinite(r) && r >= 0 && r <= 1000 ? r : 0,
    completedAt: d.completedAt,
    restSec: d.restSec,
  };
}

function lastSummary(sets: SessionSet[] | undefined): string | null {
  if (!sets?.length) return null;
  return sets.map((s) => (s.weightKg ? `${fmtKg(s.weightKg)}×${s.reps}` : `${s.reps}`)).join(", ");
}

function useElapsed(startedAt: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

function Workout({ session, catalog, lastByExercise }: { session: WorkoutSession; catalog: ExerciseCatalog; lastByExercise: Map<string, SessionSet[]> }) {
  const router = useRouter();
  const { saveSets, finish, deleteSession } = useWorkoutActions();
  const timer = useRestTimer();
  const elapsed = useElapsed(session.startedAt);
  const [drafts, setDrafts] = useState<DraftSet[]>(() => session.sets.map(toDraft));
  const [version, setVersion] = useState(0);
  const [picking, setPicking] = useState(false);
  const [sheet, setSheet] = useState<"finish" | "cancel" | null>(null);
  const [busy, setBusy] = useState(false);

  const sets = useMemo(() => drafts.map(toSet), [drafts]);
  const save = useCallback((value: SessionSet[]) => saveSets(session.id, value), [saveSets, session.id]);
  const { flush } = useAutosave(sets, version, save, { delay: 350 });

  const change = (updater: (list: DraftSet[]) => DraftSet[]) => {
    setDrafts(updater);
    setVersion((v) => v + 1);
  };
  const update = (uid: number, patch: Partial<DraftSet>) => change((list) => list.map((d) => (d.uid === uid ? { ...d, ...patch } : d)));

  const blocks = useMemo(() => {
    const order: string[] = [];
    for (const d of drafts) if (!order.includes(d.exerciseId)) order.push(d.exerciseId);
    return order.map((exerciseId) => ({ exerciseId, sets: drafts.filter((d) => d.exerciseId === exerciseId) }));
  }, [drafts]);

  const doneCount = sets.filter((s) => s.completedAt !== null).length;

  const toggle = (d: DraftSet) => {
    if (d.completedAt !== null) {
      haptics.impact("light");
      update(d.uid, { completedAt: null });
      return;
    }
    const s = toSet(d);
    if (s.reps <= 0) {
      haptics.notify("error");
      toast("Укажите количество повторов", "error");
      return;
    }
    haptics.notify("success");
    update(d.uid, { completedAt: Date.now() });
    timer.start(d.restSec);
  };

  const addSet = (exerciseId: string) => {
    haptics.impact("light");
    change((list) => {
      const own = list.filter((d) => d.exerciseId === exerciseId);
      const last = own[own.length - 1];
      const copy: DraftSet = { uid: uidCounter++, exerciseId, weight: last?.weight ?? "", reps: last?.reps ?? "10", completedAt: null, restSec: last?.restSec ?? 90 };
      const index = list.lastIndexOf(last);
      return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
    });
  };

  /** Убирает последний НЕвыполненный подход упражнения — выполненные случайно не удалить. */
  const removeLastOpenSet = (exerciseId: string) => {
    haptics.impact("light");
    change((list) => {
      const target = [...list].reverse().find((d) => d.exerciseId === exerciseId && d.completedAt === null);
      return target ? list.filter((d) => d.uid !== target.uid) : list;
    });
  };

  const addExercise = (exerciseId: string) => {
    const last = lastByExercise.get(exerciseId);
    const base = last?.[0];
    change((list) => [
      ...list,
      ...Array.from({ length: Math.max(1, last?.length ?? 3) }, (_, i) => ({
        uid: uidCounter++,
        exerciseId,
        weight: fmtKg(last?.[i]?.weightKg ?? base?.weightKg ?? null),
        reps: String(last?.[i]?.reps ?? base?.reps ?? 10),
        completedAt: null,
        restSec: 90,
      })),
    ]);
    setPicking(false);
  };

  const onFinish = async () => {
    setBusy(true);
    await flush();
    const result = await finish(session.id);
    setBusy(false);
    if (result) {
      timer.stop();
      router.replace(`/workouts/session/?id=${encodeURIComponent(session.id)}&done=1`);
    }
  };

  const onCancel = async () => {
    setBusy(true);
    const ok = await deleteSession(session.id, "Тренировка отменена");
    setBusy(false);
    if (ok) {
      timer.stop();
      router.replace("/workouts/");
    }
  };

  return (
    <>
      <PageHeader
        title={session.title}
        subtitle={
          <span className="tabular">
            ⏱ {formatClock(elapsed)} · {doneCount} {plural(doneCount, ["подход", "подхода", "подходов"])}
          </span>
        }
        backHref="/workouts/"
        action={
          <Button size="sm" className="mb-1.5" aria-label="Завершить" onClick={() => setSheet("finish")}>
            <Flag className="size-4" />
            <span className="hidden min-[400px]:inline">Завершить</span>
          </Button>
        }
      />

      <div className="space-y-3">
        {blocks.map((block) => {
          const last = lastSummary(lastByExercise.get(block.exerciseId));
          return (
            <Card key={block.exerciseId} className="p-3.5">
              <div className="mb-2 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Link href={`/workouts/exercise/?id=${encodeURIComponent(block.exerciseId)}`} className="block truncate text-[16px] font-semibold">
                    {catalog.name(block.exerciseId)}
                  </Link>
                  <p className="truncate text-[12.5px] text-muted-foreground">{last ? `Прошлый раз: ${last}` : "Первый раз"}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Убрать «${catalog.name(block.exerciseId)}»`}
                  onClick={() => change((list) => list.filter((d) => d.exerciseId !== block.exerciseId))}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-[22px_1fr_1fr_48px] items-center gap-x-2 gap-y-1.5 text-[12px] font-medium text-muted-foreground">
                <span>#</span>
                <span className="pl-1">кг</span>
                <span className="pl-1">повторы</span>
                <span />
                {block.sets.map((d, i) => {
                  const done = d.completedAt !== null;
                  const label = `${catalog.name(block.exerciseId)}, подход ${i + 1}`;
                  return (
                    <div key={d.uid} className="contents">
                      <span className={cn("tabular text-[14px] font-bold", done ? "text-workouts" : "text-foreground")}>{i + 1}</span>
                      <input
                        inputMode="decimal"
                        aria-label={`${label}: вес`}
                        placeholder="—"
                        value={d.weight}
                        onChange={(e) => update(d.uid, { weight: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className={cn("tabular h-11 w-full min-w-0 rounded-xl px-3 text-[16px] font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring", done ? "bg-workouts/12" : "bg-muted")}
                      />
                      <input
                        inputMode="numeric"
                        aria-label={`${label}: повторы`}
                        placeholder="0"
                        value={d.reps}
                        onChange={(e) => update(d.uid, { reps: e.target.value.replace(/\D/g, "") })}
                        onFocus={(e) => e.target.select()}
                        className={cn("tabular h-11 w-full min-w-0 rounded-xl px-3 text-[16px] font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring", done ? "bg-workouts/12" : "bg-muted")}
                      />
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        aria-label={`${label}: выполнен`}
                        onClick={() => toggle(d)}
                        className={cn("grid h-11 w-12 place-items-center rounded-xl transition-colors active:scale-95", done ? "bg-workouts text-white" : "bg-muted text-subtle-foreground")}
                      >
                        <Check className="size-5" strokeWidth={3} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-label={`Убрать подход: ${catalog.name(block.exerciseId)}`}
                  disabled={!block.sets.some((d) => d.completedAt === null)}
                  onClick={() => removeLastOpenSet(block.exerciseId)}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[14px] font-semibold text-muted-foreground active:bg-muted disabled:opacity-30"
                >
                  <Minus className="size-4" />
                  Подход
                </button>
                <button
                  type="button"
                  aria-label={`Добавить подход: ${catalog.name(block.exerciseId)}`}
                  onClick={() => addSet(block.exerciseId)}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[14px] font-semibold text-workouts active:bg-muted"
                >
                  <Plus className="size-4" />
                  Подход
                </button>
              </div>
            </Card>
          );
        })}

        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-4 text-[15px] font-semibold text-workouts active:bg-muted"
        >
          <Plus className="size-[18px]" />
          Добавить упражнение
        </button>
        <Button size="lg" variant="ghost" className="text-destructive" onClick={() => setSheet("cancel")}>
          Отменить тренировку
        </Button>
      </div>

      {/* Место под таймер отдыха, чтобы он не перекрывал последние подходы */}
      {timer.active ? <div className="h-20" /> : null}
      <RestTimerBar timer={timer} />

      <Sheet open={picking} onOpenChange={setPicking} title="Добавить упражнение" className="h-[88dvh]">
        {picking ? <ExercisePicker catalog={catalog} onPick={(e) => addExercise(e.id)} /> : null}
      </Sheet>

      <Sheet open={sheet === "finish"} onOpenChange={(o) => setSheet(o ? "finish" : null)} title="Завершить тренировку?">
        <div className="space-y-2.5 pb-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "время", value: formatClock(elapsed) },
              { label: "подходов", value: `${doneCount} из ${sets.length}` },
              { label: "тоннаж, кг", value: formatNumber(volume(sets)) },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl bg-muted px-2 py-3">
                <p className="tabular text-[17px] font-bold">{c.value}</p>
                <p className="text-[12px] text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
          {doneCount < sets.length ? (
            <p className="px-1 text-[13px] text-muted-foreground">Невыполненные подходы ({sets.length - doneCount}) не попадут в историю.</p>
          ) : null}
          <Button size="lg" disabled={busy || doneCount === 0} onClick={onFinish}>
            <Flag />
            Завершить и сохранить
          </Button>
          {doneCount === 0 ? <p className="px-1 text-center text-[13px] text-muted-foreground">Отметьте хотя бы один подход.</p> : null}
        </div>
      </Sheet>

      <Sheet open={sheet === "cancel"} onOpenChange={(o) => setSheet(o ? "cancel" : null)} title="Отменить тренировку?">
        <div className="space-y-2.5 pb-2">
          <p className="text-[14.5px] text-muted-foreground">Все отмеченные подходы этой тренировки будут удалены.</p>
          <Button size="lg" variant="destructive" disabled={busy} onClick={onCancel}>
            <Trash2 />
            Отменить тренировку
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setSheet(null)}>
            Продолжить тренировку
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export function ActiveWorkoutScreen() {
  const data = useActiveSession();
  const catalog = useExerciseCatalog();
  if (!data || !catalog) return <div className="min-h-[60dvh]" aria-busy="true" />;
  if (!data.active) {
    return (
      <>
        <PageHeader title="Тренировка" backHref="/workouts/" />
        <Card className="p-0">
          <EmptyState icon={Dumbbell} color="var(--c-workouts)" title="Нет активной тренировки" description="Начните тренировку по программе или пустую на экране тренировок.">
            <Link href="/workouts/" className="inline-flex h-11 items-center rounded-2xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground">
              К тренировкам
            </Link>
          </EmptyState>
        </Card>
      </>
    );
  }
  // key — по ID тренировки: черновик инициализируется из базы один раз и дальше живёт локально
  return <Workout key={data.active.id} session={data.active} catalog={catalog} lastByExercise={data.lastByExercise} />;
}
