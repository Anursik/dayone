"use client";

import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";
import { TodayLabel } from "@/components/ui/today-label";
import { WeekStrip } from "@/components/ui/week-strip";

export function HabitsScreen() {
  return (
    <>
      <PageHeader title="Привычки" subtitle={<TodayLabel />} />
      <WeekStrip color="var(--c-habits)" />

      <SectionTitle>На сегодня</SectionTitle>
      <Card className="p-0">
        <EmptyState
          icon={ListChecks}
          color="var(--c-habits)"
          title="Привычек пока нет"
          description="Здесь будут ваши привычки с отметками, сериями и календарём. Создание привычек появится в ближайшем обновлении."
        />
      </Card>
    </>
  );
}
