"use client";

import { Archive, ListChecks, Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListGroup, ListRowLink } from "@/components/ui/list-row";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionTitle } from "@/components/ui/section-title";
import { useHabitActions, useHabitsOverview } from "@/features/habits/use-habits";
import { useNow } from "@/hooks/use-now";
import { formatLongDate, fromDayKey, toDayKey } from "@/lib/date";
import { plural } from "@/lib/format";
import { HabitCard } from "./habit-card";
import { HabitFormSheet } from "./habit-form-sheet";
import { HabitStatsCard } from "./habit-stats-card";
import { HabitWeekStrip } from "./habit-week-strip";

export function HabitsScreen() {
  const now = useNow();
  const todayKey = now ? toDayKey(now) : null;
  const [picked, setPicked] = useState<string | null>(null);
  // Выбранный день не может быть в будущем (например, после смены суток остаётся корректным)
  const selectedKey = picked && todayKey && picked <= todayKey ? picked : todayKey;
  const overview = useHabitsOverview(todayKey, selectedKey);
  const { toggle } = useHabitActions();
  const [formOpen, setFormOpen] = useState(false);

  const isToday = selectedKey === todayKey;
  const createButton = (
    <Button size="icon" aria-label="Новая привычка" onClick={() => setFormOpen(true)} className="mb-1">
      <Plus className="size-5" />
    </Button>
  );

  if (!overview || !todayKey || !selectedKey) {
    return (
      <>
        <PageHeader title="Привычки" subtitle={<span className="inline-block min-h-[1.25em]" />} />
        <div className="min-h-[50dvh]" aria-busy="true" />
      </>
    );
  }

  const done = overview.forDay.filter((h) => h.doneOnDay).length;
  const total = overview.forDay.length;

  return (
    <>
      <PageHeader title="Привычки" subtitle={formatLongDate(fromDayKey(todayKey))} action={createButton} />

      {overview.activeCount === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={ListChecks}
            color="var(--c-habits)"
            title="Привычек пока нет"
            description="Создайте первую привычку — отмечайте её каждый день и следите за сериями."
          >
            <Button size="lg" onClick={() => setFormOpen(true)}>
              <Plus />
              Создать привычку
            </Button>
          </EmptyState>
        </Card>
      ) : (
        <>
          <HabitWeekStrip days={overview.weekDays} todayKey={todayKey} selectedKey={selectedKey} onSelect={setPicked} />

          <SectionTitle
            action={
              total > 0 ? (
                <span className="tabular text-[13px] font-semibold text-muted-foreground">
                  {done} из {total}
                </span>
              ) : null
            }
          >
            {isToday ? "Сегодня" : formatLongDate(fromDayKey(selectedKey))}
          </SectionTitle>
          {total > 0 ? <ProgressBar className="mb-3" value={done / total} color="var(--c-habits)" label="Выполнено за день" /> : null}

          {total === 0 ? (
            <Card className="text-center text-[14px] text-muted-foreground">
              На этот день привычек по расписанию нет.
            </Card>
          ) : (
            <div className="space-y-2.5">
              {overview.forDay.map((item) => (
                <HabitCard
                  key={item.habit.id}
                  habit={item.habit}
                  streak={item.streak}
                  done={item.doneOnDay}
                  onToggle={() => toggle(item.habit.id, selectedKey)}
                />
              ))}
            </div>
          )}

          {overview.notScheduled.length > 0 ? (
            <>
              <SectionTitle>{isToday ? "Не сегодня" : "Не в этот день"}</SectionTitle>
              <div className="space-y-2.5">
                {overview.notScheduled.map((item) => (
                  <HabitCard key={item.habit.id} habit={item.habit} streak={item.streak} />
                ))}
              </div>
            </>
          ) : null}

          <SectionTitle>Статистика</SectionTitle>
          <HabitStatsCard week={overview.week} month={overview.month} last7={overview.last7} todayKey={todayKey} />
        </>
      )}

      {overview.archivedCount > 0 ? (
        <ListGroup className="mt-6">
          <ListRowLink
            href="/habits/archive/"
            icon={Archive}
            title="Архив"
            subtitle={`${overview.archivedCount} ${plural(overview.archivedCount, ["привычка", "привычки", "привычек"])}`}
          />
        </ListGroup>
      ) : null}

      <HabitFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
