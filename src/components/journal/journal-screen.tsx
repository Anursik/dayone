"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TodayLabel } from "@/components/ui/today-label";

export function JournalScreen() {
  return (
    <>
      <PageHeader title="Дневник" subtitle={<TodayLabel />} backHref="/profile" />
      <Card className="p-0">
        <EmptyState
          icon={BookOpen}
          color="var(--c-journal)"
          title="Записей пока нет"
          description="Ежедневные записи, настроение, оценка дня и ответы на вопросы «Что получилось?», «Что не получилось?», «Что улучшить завтра?» с автосохранением."
        />
      </Card>
    </>
  );
}
