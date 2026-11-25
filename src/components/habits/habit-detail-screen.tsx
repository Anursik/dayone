"use client";

import { Archive, ArchiveRestore, CalendarCheck, Flame, Pencil, SearchX, Trash2, Trophy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBadge } from "@/components/ui/icon-badge";
import { SectionTitle } from "@/components/ui/section-title";
import { Sheet } from "@/components/ui/sheet";
import { useHabitActions, useHabitDetail } from "@/features/habits/use-habits";
import { useNow } from "@/hooks/use-now";
import { describeSchedule, type RangeStats } from "@/lib/calculations/habits";
import { toDayKey } from "@/lib/date";
import { plural } from "@/lib/format";
import { habitColor, habitIcon } from "@/lib/habits/appearance";
import { HabitCalendar } from "./habit-calendar";
import { HabitFormSheet } from "./habit-form-sheet";

function StatTile({ icon, color, label, value, hint }: { icon: typeof Flame; color: string; label: string; value: string; hint: string }) {
  return (
    <Card className="p-3.5">
      <IconBadge icon={icon} color={color} size="sm" />
      <p className="tabular mt-2.5 text-[22px] leading-tight font-bold tracking-tight">{value}</p>
      <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[12px] text-subtle-foreground">{hint}</p>
    </Card>
  );
}

const pct = (s: RangeStats) => (s.rate === null ? "—" : `${Math.round(s.rate * 100)}%`);
const days = (n: number) => `${n} ${plural(n, ["день", "дня", "дней"])}`;

export function HabitDetailScreen() {
  const id = useSearchParams().get("id");
  const now = useNow();
  const todayKey = now ? toDayKey(now) : null;
  const detail = useHabitDetail(id, todayKey);
  const { toggle, setArchived, remove } = useHabitActions();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (detail === undefined || !todayKey) return <div className="min-h-[60dvh]" aria-busy="true" />;

  if (detail === null) {
    return (
      <>
        <PageHeader title="Привычка" backHref="/habits/" />
        <EmptyState icon={SearchX} color="var(--muted-foreground)" title="Привычка не найдена" description="Возможно, она была удалена." />
      </>
    );
  }

  const { habit } = detail;
  const color = habitColor(habit.color);

  return (
    <>
      <PageHeader
        title={habit.name}
        subtitle={
          <span className="inline-flex items-center gap-2">
            {describeSchedule(habit.schedule.days)}
            {habit.archived ? <span className="rounded-full bg-muted px-2 py-0.5 text-[12px] font-semibold">в архиве</span> : null}
          </span>
        }
        backHref="/habits/"
        action={<IconBadge icon={habitIcon(habit.icon)} color={color} size="lg" className="mb-1" />}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Flame} color="var(--c-nutrition)" label="Текущая серия" value={days(detail.streak)} hint="подряд по расписанию" />
        <StatTile icon={Trophy} color="var(--c-journal)" label="Лучшая серия" value={days(detail.best)} hint="за всё время" />
        <StatTile icon={CalendarCheck} color={color} label="Эта неделя" value={pct(detail.week)} hint={detail.week.planned ? `${detail.week.done} из ${detail.week.planned}` : "нет данных"} />
        <StatTile icon={CalendarCheck} color={color} label="Этот месяц" value={pct(detail.month)} hint={detail.month.planned ? `${detail.month.done} из ${detail.month.planned}` : "нет данных"} />
      </div>
      <p className="mt-2.5 px-1 text-[13px] text-muted-foreground">
        Всего выполнено: <span className="tabular font-semibold text-foreground">{detail.total}</span>
      </p>

      <SectionTitle>История</SectionTitle>
      <Card>
        <HabitCalendar habit={habit} done={detail.done} todayKey={todayKey} color={color} onToggle={(key) => toggle(habit.id, key)} />
      </Card>

      <SectionTitle>Управление</SectionTitle>
      <div className="space-y-2.5">
        {!habit.archived ? (
          <Button size="lg" variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil />
            Редактировать
          </Button>
        ) : null}
        <Button
          size="lg"
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await setArchived(habit.id, !habit.archived);
            setBusy(false);
          }}
        >
          {habit.archived ? <ArchiveRestore /> : <Archive />}
          {habit.archived ? "Вернуть из архива" : "В архив"}
        </Button>
        <Button size="lg" variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 />
          Удалить
        </Button>
      </div>
      {!habit.archived ? (
        <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-muted-foreground">
          Архив скрывает привычку из списка и статистики, но сохраняет историю. Удаление стирает привычку вместе с историей.
        </p>
      ) : null}

      <HabitFormSheet open={editOpen} onOpenChange={setEditOpen} habit={habit} />
      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen} title="Удалить привычку?">
        <div className="space-y-2.5 pb-2">
          <p className="text-[14.5px] leading-relaxed text-muted-foreground">
            «{habit.name}» и вся история выполнения ({detail.total} {plural(detail.total, ["отметка", "отметки", "отметок"])}) будут удалены
            безвозвратно. Если хотите просто скрыть привычку — отправьте её в архив.
          </p>
          <Button
            size="lg"
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const ok = await remove(habit.id);
              setBusy(false);
              if (ok) {
                setDeleteOpen(false);
                router.replace("/habits/");
              }
            }}
          >
            <Trash2 />
            Удалить навсегда
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setDeleteOpen(false)}>
            Отмена
          </Button>
        </div>
      </Sheet>
    </>
  );
}
