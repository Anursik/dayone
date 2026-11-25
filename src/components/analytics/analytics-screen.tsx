"use client";

import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export function AnalyticsScreen() {
  return (
    <>
      <PageHeader title="Статистика" subtitle="Прогресс за неделю и месяц" backHref="/profile" />
      <Card className="p-0">
        <EmptyState
          icon={BarChart3}
          color="var(--c-analytics)"
          title="Пока нечего показать"
          description="Графики строятся только по вашим реальным данным: привычкам, весу, питанию и тренировкам. Они появятся, когда накопятся записи."
        />
      </Card>
    </>
  );
}
