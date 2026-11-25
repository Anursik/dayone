import type { Macros } from "@/lib/calculations/nutrition";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const one = (v: number) => (Math.round(v * 10) / 10).toLocaleString("ru-RU", { maximumFractionDigits: 1 });

/** Компактная строка «Б 12 · Ж 3,4 · У 50». */
export function MacroLine({ macros, className }: { macros: Macros; className?: string }) {
  return (
    <span className={cn("tabular text-[12.5px] text-muted-foreground", className)}>
      <span className="text-protein">Б</span> {one(macros.protein)} · <span className="text-fat">Ж</span> {one(macros.fat)} ·{" "}
      <span className="text-carbs">У</span> {one(macros.carbs)}
    </span>
  );
}

/** Крупные значения КБЖУ для превью порции. */
export function MacroGrid({ macros }: { macros: Macros }) {
  const cells = [
    { label: "ккал", value: formatNumber(macros.kcal), color: "var(--c-nutrition)" },
    { label: "белки", value: one(macros.protein), color: "var(--c-protein)" },
    { label: "жиры", value: one(macros.fat), color: "var(--c-fat)" },
    { label: "углев.", value: one(macros.carbs), color: "var(--c-carbs)" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2" aria-live="polite">
      {cells.map((c) => (
        <div key={c.label} className="rounded-2xl bg-muted px-2 py-2.5 text-center">
          <p className="tabular text-[17px] leading-tight font-bold" style={{ color: c.color }}>
            {c.value}
          </p>
          <p className="text-[11.5px] font-medium text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
