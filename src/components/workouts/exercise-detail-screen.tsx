"use client";

import { Dumbbell, Pencil, Repeat, SearchX, Trash2, TrendingUp, Trophy, Weight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBadge } from "@/components/ui/icon-badge";
import { SectionTitle } from "@/components/ui/section-title";
import { Sheet } from "@/components/ui/sheet";
import { useExerciseCatalog, useExerciseDetail, useWorkoutActions } from "@/features/workouts/use-workouts";
import { formatNumber } from "@/lib/format";
import { ExerciseForm } from "./exercise-picker";
import { ProgressChart } from "./progress-chart";

const kg = (v: number) => v.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const shortDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

function RecordTile({ icon, label, value, hint }: { icon: typeof Trophy; label: string; value: string; hint: string }) {
  return (
    <Card className="p-3.5">
      <IconBadge icon={icon} color="var(--c-journal)" size="sm" />
      <p className="tabular mt-2.5 text-[20px] leading-tight font-bold">{value}</p>
      <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
      <p className="truncate text-[12px] text-subtle-foreground">{hint}</p>
    </Card>
  );
}

export function ExerciseDetailScreen() {
  const id = useSearchParams().get("id");
  const catalog = useExerciseCatalog();
  const detail = useExerciseDetail(id);
  const { deleteExercise } = useWorkoutActions();
  const router = useRouter();
  const [sheet, setSheet] = useState<"edit" | "delete" | null>(null);

  if (!catalog || !detail) return <div className="min-h-[60dvh]" aria-busy="true" />;
  const exercise = id ? catalog.get(id) : undefined;
  if (!exercise) {
    return (
      <>
        <PageHeader title="Упражнение" backHref="/workouts/exercises/" />
        <EmptyState icon={SearchX} color="var(--muted-foreground)" title="Упражнение не найдено" />
      </>
    );
  }

  const { records: r, progress, history } = detail;
  const hasWeight = Boolean(r.maxWeight);
  const custom = exercise.source === "custom" ? catalog.custom.find((c) => c.id === exercise.id) : undefined;

  return (
    <>
      <PageHeader
        title={exercise.name}
        subtitle={`${exercise.muscleGroup ?? "Без группы"}${custom ? " · своё" : ""}`}
        backHref="/workouts/exercises/"
        action={
          custom ? (
            <Button size="icon" variant="secondary" aria-label="Изменить упражнение" className="mb-1" onClick={() => setSheet("edit")}>
              <Pencil className="size-4" />
            </Button>
          ) : null
        }
      />

      {history.length === 0 ? (
        <Card className="p-0">
          <EmptyState icon={Dumbbell} color="var(--c-workouts)" title="Ещё не выполнялось" description="Рекорды и график прогресса появятся после первой завершённой тренировки с этим упражнением." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {hasWeight ? (
              <>
                <RecordTile icon={Weight} label="Макс. вес" value={`${kg(r.maxWeight!.weightKg)} кг`} hint={`× ${r.maxWeight!.reps} · ${shortDate.format(r.maxWeight!.at)}`} />
                <RecordTile icon={Trophy} label="Расчётный 1ПМ" value={`${kg(r.bestOneRepMax!.value)} кг`} hint={`${kg(r.bestOneRepMax!.weightKg)} × ${r.bestOneRepMax!.reps}`} />
              </>
            ) : null}
            <RecordTile icon={Repeat} label="Макс. повторов" value={String(r.maxReps?.reps ?? 0)} hint={r.maxReps ? shortDate.format(r.maxReps.at) : ""} />
            {r.maxSessionVolume ? (
              <RecordTile icon={TrendingUp} label="Тоннаж за тренировку" value={`${formatNumber(r.maxSessionVolume.value)} кг`} hint={shortDate.format(r.maxSessionVolume.at)} />
            ) : (
              <RecordTile icon={TrendingUp} label="Тренировок" value={String(history.length)} hint="с этим упражнением" />
            )}
          </div>
          <p className="mt-2 px-1 text-[12px] leading-relaxed text-subtle-foreground">1ПМ — расчётный максимум на одно повторение по формуле Эпли: вес × (1 + повторы / 30).</p>

          <SectionTitle>Прогресс</SectionTitle>
          <Card>
            <ProgressChart points={progress} hasWeight={hasWeight} />
          </Card>

          <SectionTitle>История</SectionTitle>
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {history.map(({ session, sets }) => (
                <li key={session.id}>
                  <Link href={`/workouts/session/?id=${encodeURIComponent(session.id)}`} className="block px-4 py-3 active:bg-muted">
                    <p className="text-[14px] font-semibold">
                      {dateFmt.format(session.startedAt)} <span className="font-normal text-muted-foreground">· {session.title}</span>
                    </p>
                    <p className="tabular text-[13px] text-muted-foreground">{sets.map((s) => (s.weightKg ? `${kg(s.weightKg)}×${s.reps}` : `${s.reps}`)).join(", ")}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {custom ? (
        <Button size="lg" variant="destructive" className="mt-5" onClick={() => setSheet("delete")}>
          <Trash2 />
          Удалить упражнение
        </Button>
      ) : null}

      <Sheet open={sheet === "edit"} onOpenChange={(o) => setSheet(o ? "edit" : null)} title="Изменить упражнение">
        {sheet === "edit" && custom ? <ExerciseForm initial={custom} submitLabel="Сохранить" onSaved={() => setSheet(null)} /> : null}
      </Sheet>
      <Sheet open={sheet === "delete"} onOpenChange={(o) => setSheet(o ? "delete" : null)} title="Удалить упражнение?">
        <div className="space-y-2.5 pb-2">
          <Button
            size="lg"
            variant="destructive"
            onClick={async () => {
              if (custom && (await deleteExercise(custom.id))) router.replace("/workouts/exercises/");
              else setSheet(null);
            }}
          >
            <Trash2 />
            Удалить
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setSheet(null)}>
            Отмена
          </Button>
        </div>
      </Sheet>
    </>
  );
}
