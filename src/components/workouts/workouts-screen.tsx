"use client";

import { ChevronRight, Dumbbell, Library, Pencil, Play, Plus, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListGroup, ListRowLink } from "@/components/ui/list-row";
import { SectionTitle } from "@/components/ui/section-title";
import { useExerciseCatalog, useWorkoutActions, useWorkoutsOverview } from "@/features/workouts/use-workouts";
import { useNow } from "@/hooks/use-now";
import { formatClock } from "@/lib/calculations/workouts";
import type { WorkoutProgram } from "@/lib/db/schemas";
import { startOfWeek } from "@/lib/date";
import { formatDuration, formatNumber, plural } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";

const dateFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long" });

function ActiveCard({ startedAt, title }: { startedAt: number; title: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <Link href="/workouts/active/" onClick={() => haptics.impact("medium")} className="block transition-transform active:scale-[0.99]">
      <div className="flex items-center gap-3 rounded-[var(--radius-card)] bg-workouts p-4 text-white shadow-card">
        <span className="grid size-11 place-items-center rounded-2xl bg-white/20">
          <Timer className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium opacity-85">Тренировка идёт</p>
          <p className="truncate text-[17px] font-bold">{title}</p>
        </div>
        <span className="tabular text-[20px] font-bold">{formatClock((now - startedAt) / 1000)}</span>
        <ChevronRight className="size-5 opacity-80" />
      </div>
    </Link>
  );
}

export function WorkoutsScreen() {
  const router = useRouter();
  const now = useNow();
  const weekStart = now ? startOfWeek(now).getTime() : null;
  const overview = useWorkoutsOverview(weekStart);
  const catalog = useExerciseCatalog();
  const { start } = useWorkoutActions();
  const [busy, setBusy] = useState(false);

  const begin = async (program: WorkoutProgram | null) => {
    setBusy(true);
    const session = await start(program);
    setBusy(false);
    if (session) router.push("/workouts/active/");
  };

  if (!overview || !catalog) {
    return (
      <>
        <PageHeader title="Тренировки" />
        <div className="min-h-[60dvh]" aria-busy="true" />
      </>
    );
  }

  const { active, programs, history, week } = overview;

  return (
    <>
      <PageHeader
        title="Тренировки"
        subtitle={`На этой неделе: ${week.count} ${plural(week.count, ["тренировка", "тренировки", "тренировок"])}${week.minutes ? ` · ${formatDuration(week.minutes)}` : ""}`}
      />

      {active ? (
        <ActiveCard startedAt={active.startedAt} title={active.title} />
      ) : (
        <Button size="lg" disabled={busy} onClick={() => begin(null)}>
          <Play />
          Пустая тренировка
        </Button>
      )}

      <SectionTitle
        action={
          <Link href="/workouts/program/?id=new" className="text-[14px] font-semibold text-workouts" aria-label="Новая программа">
            + Программа
          </Link>
        }
      >
        Программы
      </SectionTitle>
      {programs.length === 0 ? (
        <Card className="p-0">
          <EmptyState icon={Dumbbell} color="var(--c-workouts)" title="Программ пока нет" description="Соберите программу из упражнений с подходами, повторами, весом и отдыхом — и запускайте её в зале одним нажатием.">
            <Link href="/workouts/program/?id=new" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground">
              <Plus className="size-[18px]" />
              Создать программу
            </Link>
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {programs.map((p) => {
            const sets = p.items.reduce((s, i) => s + i.sets, 0);
            return (
              <Card key={p.id} className="flex items-center gap-3 py-3 pr-3">
                <Link href={`/workouts/program/?id=${encodeURIComponent(p.id)}`} className="min-w-0 flex-1" aria-label={`Изменить «${p.name}»`}>
                  <p className="truncate text-[15.5px] font-semibold">{p.name}</p>
                  <p className="truncate text-[12.5px] text-muted-foreground">
                    {p.items.length} {plural(p.items.length, ["упражнение", "упражнения", "упражнений"])} · {sets} {plural(sets, ["подход", "подхода", "подходов"])}
                  </p>
                  <p className="truncate text-[12.5px] text-subtle-foreground">{p.items.map((i) => catalog.name(i.exerciseId)).join(", ")}</p>
                </Link>
                <Link href={`/workouts/program/?id=${encodeURIComponent(p.id)}`} aria-label="Изменить" className="grid size-9 place-items-center rounded-full text-muted-foreground">
                  <Pencil className="size-4" />
                </Link>
                <Button size="sm" disabled={busy || Boolean(active)} onClick={() => begin(p)} aria-label={`Начать «${p.name}»`}>
                  <Play className="size-4" />
                  Начать
                </Button>
              </Card>
            );
          })}
          {active ? <p className="px-1 text-[12.5px] text-muted-foreground">Сначала завершите текущую тренировку.</p> : null}
        </div>
      )}

      {week.volume > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {[
            { label: "тренировок", value: String(week.count) },
            { label: "время", value: formatDuration(week.minutes) },
            { label: "тоннаж, кг", value: formatNumber(week.volume) },
          ].map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <p className="tabular text-[17px] font-bold">{s.value}</p>
              <p className="text-[11.5px] text-muted-foreground">{s.label} за неделю</p>
            </Card>
          ))}
        </div>
      ) : null}

      <SectionTitle>История</SectionTitle>
      {history.length === 0 ? (
        <Card className="text-center text-[14px] text-muted-foreground">Завершённые тренировки появятся здесь.</Card>
      ) : (
        <ListGroup>
          {history.slice(0, 30).map((h) => (
            <ListRowLink
              key={h.session.id}
              href={`/workouts/session/?id=${encodeURIComponent(h.session.id)}`}
              icon={Dumbbell}
              color="var(--c-workouts)"
              title={h.session.title}
              subtitle={`${dateFmt.format(new Date(h.session.startedAt))} · ${h.minutes !== null ? formatDuration(h.minutes) : ""} · ${h.sets} ${plural(h.sets, ["подход", "подхода", "подходов"])}${h.volume ? ` · ${formatNumber(h.volume)} кг` : ""}`}
            />
          ))}
        </ListGroup>
      )}

      <ListGroup className="mt-6">
        <ListRowLink href="/workouts/exercises/" icon={Library} color="var(--c-workouts)" title="Упражнения и рекорды" subtitle={`${catalog.all.length} в библиотеке · прогресс по каждому`} />
      </ListGroup>
    </>
  );
}
