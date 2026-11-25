"use client";

import { Dumbbell } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";

export function WorkoutsScreen() {
  return (
    <>
      <PageHeader title="Тренировки" subtitle="Программы, подходы и рекорды" />

      <SectionTitle>Программы</SectionTitle>
      <Card className="p-0">
        <EmptyState
          icon={Dumbbell}
          color="var(--c-workouts)"
          title="Программ пока нет"
          description="Здесь появятся ваши тренировочные программы, режим активной тренировки, история и личные рекорды."
        />
      </Card>
    </>
  );
}
