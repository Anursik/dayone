"use client";

import { PartyPopper, SearchX, Trash2, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";
import { Sheet } from "@/components/ui/sheet";
import { useExerciseCatalog, useSessionDetail, useWorkoutActions } from "@/features/workouts/use-workouts";
import { estimateOneRepMax, type NewRecord } from "@/lib/calculations/workouts";
import { formatDuration, formatNumber } from "@/lib/format";

const dateFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const kg = (v: number) => v.toLocaleString("ru-RU", { maximumFractionDigits: 1 });

function recordText(r: NewRecord): string {
  if (r.kind === "weight") return `Новый рабочий вес: ${kg(r.value)} кг (было ${kg(r.previous ?? 0)})`;
  if (r.kind === "oneRepMax") return `Расчётный 1ПМ: ${kg(r.value)} кг (было ${kg(r.previous ?? 0)})`;
  return `Повторов в подходе: ${r.value} (было ${r.previous ?? 0})`;
}

export function SessionDetailScreen() {
  const params = useSearchParams();
  const id = params.get("id");
  const justFinished = params.get("done") === "1";
  const data = useSessionDetail(id);
  const catalog = useExerciseCatalog();
  const { deleteSession } = useWorkoutActions();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  if (data === undefined || !catalog) return <div className="min-h-[60dvh]" aria-busy="true" />;
  if (data === null) {
    return (
      <>
        <PageHeader title="Тренировка" backHref="/workouts/" />
        <EmptyState icon={SearchX} color="var(--muted-foreground)" title="Тренировка не найдена" />
      </>
    );
  }

  const { summary, records } = data;
  const { session } = summary;
  const order: string[] = [];
  for (const s of session.sets) if (!order.includes(s.exerciseId)) order.push(s.exerciseId);

  return (
    <>
      <PageHeader title={session.title} subtitle={dateFmt.format(new Date(session.startedAt))} backHref="/workouts/" />

      {justFinished ? (
        <Card className="mb-3 flex items-center gap-3 bg-workouts text-white">
          <PartyPopper className="size-7 shrink-0" />
          <div>
            <p className="text-[16px] font-bold">Тренировка завершена!</p>
            <p className="text-[13px] opacity-90">Результаты сохранены в историю.</p>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "время", value: summary.minutes !== null ? formatDuration(summary.minutes) : "—" },
          { label: "подходов", value: String(summary.sets) },
          { label: "тоннаж, кг", value: formatNumber(summary.volume) },
        ].map((c) => (
          <Card key={c.label} className="p-3 text-center">
            <p className="tabular text-[17px] font-bold">{c.value}</p>
            <p className="text-[11.5px] text-muted-foreground">{c.label}</p>
          </Card>
        ))}
      </div>

      {records.length ? (
        <>
          <SectionTitle>Личные рекорды</SectionTitle>
          <Card className="space-y-2.5">
            {records.map((r) => (
              <div key={r.exerciseId} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-journal/15 text-journal">
                  <Trophy className="size-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14.5px] font-semibold">{catalog.name(r.exerciseId)}</p>
                  <p className="text-[13px] text-muted-foreground">{recordText(r)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>Упражнения</SectionTitle>
      <div className="space-y-2.5">
        {order.map((exerciseId) => {
          const sets = session.sets.filter((s) => s.exerciseId === exerciseId);
          return (
            <Card key={exerciseId}>
              <Link href={`/workouts/exercise/?id=${encodeURIComponent(exerciseId)}`} className="mb-2 block text-[15.5px] font-semibold">
                {catalog.name(exerciseId)}
              </Link>
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] text-muted-foreground">
                    <th className="w-8 pb-1 font-medium">#</th>
                    <th className="pb-1 font-medium">Вес</th>
                    <th className="pb-1 font-medium">Повторы</th>
                    <th className="pb-1 text-right font-medium">1ПМ</th>
                  </tr>
                </thead>
                <tbody className="tabular">
                  {sets.map((s, i) => {
                    const e1 = estimateOneRepMax(s.weightKg, s.reps);
                    return (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1.5 text-muted-foreground">{i + 1}</td>
                        <td className="py-1.5 font-semibold">{s.weightKg ? `${kg(s.weightKg)} кг` : "—"}</td>
                        <td className="py-1.5 font-semibold">{s.reps}</td>
                        <td className="py-1.5 text-right text-muted-foreground">{e1 ? kg(e1) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          );
        })}
      </div>

      <Button size="lg" variant="destructive" className="mt-5" onClick={() => setConfirm(true)}>
        <Trash2 />
        Удалить тренировку
      </Button>
      <Sheet open={confirm} onOpenChange={setConfirm} title="Удалить тренировку?">
        <div className="space-y-2.5 pb-2">
          <p className="text-[14.5px] text-muted-foreground">Тренировка исчезнет из истории, рекорды пересчитаются.</p>
          <Button
            size="lg"
            variant="destructive"
            onClick={async () => {
              if (await deleteSession(session.id)) router.replace("/workouts/");
            }}
          >
            <Trash2 />
            Удалить
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setConfirm(false)}>
            Отмена
          </Button>
        </div>
      </Sheet>
    </>
  );
}
