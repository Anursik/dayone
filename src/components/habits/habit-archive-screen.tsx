"use client";

import { Archive } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListGroup, ListRowLink } from "@/components/ui/list-row";
import { useArchivedHabits } from "@/features/habits/use-habits";
import { describeSchedule } from "@/lib/calculations/habits";
import { habitColor, habitIcon } from "@/lib/habits/appearance";

export function HabitArchiveScreen() {
  const archived = useArchivedHabits();

  return (
    <>
      <PageHeader title="Архив" subtitle="Скрытые привычки с сохранённой историей" backHref="/habits/" />
      {archived === undefined ? (
        <div className="min-h-[40dvh]" aria-busy="true" />
      ) : archived.length === 0 ? (
        <Card className="p-0">
          <EmptyState icon={Archive} color="var(--muted-foreground)" title="Архив пуст" />
        </Card>
      ) : (
        <ListGroup>
          {archived.map((habit) => (
            <ListRowLink
              key={habit.id}
              href={`/habits/view/?id=${encodeURIComponent(habit.id)}`}
              icon={habitIcon(habit.icon)}
              color={habitColor(habit.color)}
              title={habit.name}
              subtitle={describeSchedule(habit.schedule.days)}
            />
          ))}
        </ListGroup>
      )}
    </>
  );
}
