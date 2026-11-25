import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatNumber } from "@/lib/format";
import type { DashboardSummary, MacroValue } from "@/types/dashboard";

function Macro({ label, value, color }: { label: string; value: MacroValue; color: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
        <span className="tabular text-[12.5px] font-semibold">
          {formatNumber(value.eaten)}
          <span className="text-muted-foreground">{value.goal ? `/${formatNumber(value.goal)}` : ""} г</span>
        </span>
      </div>
      <ProgressBar className="mt-1.5" value={value.goal ? value.eaten / value.goal : 0} color={color} label={label} />
    </div>
  );
}

/** Калории, остаток и БЖУ за день. */
export function CalorieOverview({ nutrition }: { nutrition: DashboardSummary["nutrition"] }) {
  const { calories, caloriesGoal } = nutrition;
  const remaining = caloriesGoal !== null ? caloriesGoal - calories : null;

  return (
    <Card>
      <div className="flex items-center gap-3">
        <IconBadge icon={Flame} color="var(--c-nutrition)" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-muted-foreground">Калории</p>
          <p className="tabular text-[22px] leading-tight font-bold tracking-tight">
            {formatNumber(calories)}
            <span className="text-[14px] font-semibold text-muted-foreground">
              {caloriesGoal !== null ? ` / ${formatNumber(caloriesGoal)}` : ""} ккал
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-medium text-muted-foreground">Осталось</p>
          <p className="tabular text-[17px] font-bold">{remaining === null ? "—" : formatNumber(Math.max(remaining, 0))}</p>
        </div>
      </div>

      <ProgressBar
        className="mt-3.5 h-2"
        value={caloriesGoal ? calories / caloriesGoal : 0}
        color="var(--c-nutrition)"
        label="Калории за день"
      />

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Macro label="Белки" value={nutrition.protein} color="var(--c-protein)" />
        <Macro label="Жиры" value={nutrition.fat} color="var(--c-fat)" />
        <Macro label="Углев." value={nutrition.carbs} color="var(--c-carbs)" />
      </div>

      {caloriesGoal === null ? (
        <p className="mt-3.5 text-[12.5px] text-muted-foreground">Дневная норма КБЖУ ещё не задана.</p>
      ) : null}
    </Card>
  );
}
