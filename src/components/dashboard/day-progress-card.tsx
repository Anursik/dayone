"use client";

import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { calculateDayProgress } from "@/lib/calculations/day-progress";
import type { DashboardSummary } from "@/types/dashboard";

const partColors: Record<string, string> = {
  habits: "var(--c-habits)",
  calories: "var(--c-nutrition)",
  water: "var(--c-water)",
  sleep: "var(--c-sleep)",
};

export function DayProgressCard({ summary }: { summary: DashboardSummary }) {
  const { value, parts } = calculateDayProgress(summary);
  const percent = value === null ? null : Math.round(value * 100);

  return (
    <Card className="relative overflow-hidden p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "linear-gradient(135deg, var(--c-habits), var(--c-workouts))" }}
      />
      <div className="relative flex items-center gap-5">
        <ProgressRing value={value ?? 0} size={112} stroke={11} color="var(--c-habits)" label="Прогресс дня">
          <div className="text-center">
            <div className="tabular text-[28px] leading-none font-bold tracking-tight">
              {percent === null ? "—" : `${percent}%`}
            </div>
            <div className="mt-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">день</div>
          </div>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-tight">Прогресс дня</h2>
          {parts.length === 0 ? (
            <p className="mt-1.5 text-[13.5px] leading-snug text-muted-foreground">
              Пока нечего считать. Добавьте привычки и задайте цели по питанию, воде и сну — прогресс появится здесь.
            </p>
          ) : (
            <ul className="mt-2.5 space-y-1.5">
              {parts.map((part) => (
                <li key={part.key} className="flex items-center gap-2 text-[13.5px]">
                  <span className="size-2 rounded-full" style={{ backgroundColor: partColors[part.key] }} />
                  <span className="flex-1 text-muted-foreground">{part.label}</span>
                  <span className="tabular font-semibold">{Math.round(part.value * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
