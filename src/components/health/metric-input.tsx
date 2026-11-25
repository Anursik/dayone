"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { parseDecimal } from "@/features/nutrition/number-input";
import type { HealthEntry, HealthType } from "@/lib/db/schemas";
import { ACTIVITY_KINDS, BODY_PARTS, METRICS, WATER_QUICK } from "@/lib/health/metrics";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

type Record = (value: number, details?: { [k: string]: string | number } | null) => Promise<unknown>;

function Chips<T extends string>({ items, value, onChange, label }: { items: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          role="radio"
          aria-checked={value === item}
          onClick={() => {
            haptics.selection();
            onChange(item);
          }}
          className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-semibold", value === item ? "bg-primary text-primary-foreground" : "bg-muted")}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function range(type: HealthType, raw: string): { value: number | null; error: string | null } {
  const m = METRICS[type];
  if (!raw.trim()) return { value: null, error: "Введите значение" };
  const v = parseDecimal(raw);
  if (v === null) return { value: null, error: "Введите число" };
  if (v < m.min || v > m.max) return { value: null, error: `От ${m.min} до ${m.max}` };
  return { value: v, error: null };
}

/** Поле значения + кнопка сохранения (вес, шаги, вода, замеры). */
function SimpleInput({ type, label, suffix, initial, submitLabel, onRecord, details, resetAfter }: {
  type: HealthType;
  label: string;
  suffix: string;
  initial?: number | null;
  submitLabel: string;
  onRecord: Record;
  details?: { [k: string]: string | number } | null;
  resetAfter?: boolean;
}) {
  const [raw, setRaw] = useState(initial != null ? String(initial).replace(".", ",") : "");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const { value, error } = range(type, raw);

  return (
    <form
      className="flex items-start gap-2.5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (value === null) return haptics.notify("error");
        setBusy(true);
        const ok = await onRecord(value, details ?? null);
        setBusy(false);
        if (ok && resetAfter) {
          setRaw("");
          setSubmitted(false);
        }
      }}
    >
      <FormField className="min-w-0 flex-1" label={label} suffix={suffix} inputMode={METRICS[type].decimals ? "decimal" : "numeric"} value={raw} error={submitted ? error : null} onChange={(e) => setRaw(e.target.value)} />
      <Button type="submit" className="mt-[26px] h-12" disabled={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}

function SleepInput({ initial, onRecord }: { initial: number | null; onRecord: Record }) {
  const [h, setH] = useState(initial != null ? String(Math.floor(initial / 60)) : "");
  const [m, setM] = useState(initial != null ? String(initial % 60) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const hours = h.trim() ? Number.parseInt(h, 10) : 0;
        const mins = m.trim() ? Number.parseInt(m, 10) : 0;
        if (!Number.isFinite(hours) || !Number.isFinite(mins) || hours < 0 || hours > 24 || mins < 0 || mins > 59 || hours * 60 + mins < 1 || hours * 60 + mins > 1440) {
          setError("Часы от 0 до 24, минуты от 0 до 59");
          return haptics.notify("error");
        }
        setError(null);
        setBusy(true);
        await onRecord(hours * 60 + mins);
        setBusy(false);
      }}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="Часы" suffix="ч" inputMode="numeric" value={h} onChange={(e) => setH(e.target.value.replace(/\D/g, ""))} />
        <FormField label="Минуты" suffix="мин" inputMode="numeric" value={m} onChange={(e) => setM(e.target.value.replace(/\D/g, ""))} />
      </div>
      {error ? <p className="px-1 text-[12.5px] text-destructive">{error}</p> : null}
      <p className="px-1 text-[12.5px] text-muted-foreground">Сон записывается на день пробуждения.</p>
      <Button type="submit" size="lg" disabled={busy}>
        Сохранить сон
      </Button>
    </form>
  );
}

function ActivityInput({ onRecord }: { onRecord: Record }) {
  const [kind, setKind] = useState<(typeof ACTIVITY_KINDS)[number]>("Ходьба");
  return (
    <div className="space-y-3">
      <Chips items={ACTIVITY_KINDS} value={kind} onChange={setKind} label="Вид активности" />
      <SimpleInput type="activity" label="Длительность" suffix="мин" submitLabel="Добавить" onRecord={onRecord} details={{ kind }} resetAfter />
    </div>
  );
}

function MeasurementInput({ dayEntries, onRecord }: { dayEntries: HealthEntry[]; onRecord: Record }) {
  const [part, setPart] = useState<(typeof BODY_PARTS)[number]>("Талия");
  const current = dayEntries.find((e) => e.details?.part === part)?.value ?? null;
  return (
    <div className="space-y-3">
      <Chips items={BODY_PARTS} value={part} onChange={setPart} label="Часть тела" />
      <SimpleInput key={part + String(current)} type="measurement" label={`${part}, обхват`} suffix="см" initial={current} submitLabel="Сохранить" onRecord={onRecord} details={{ part }} />
    </div>
  );
}

function WaterInput({ onRecord }: { onRecord: Record }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {WATER_QUICK.map((ml) => (
          <button
            key={ml}
            type="button"
            disabled={busy}
            aria-label={`Добавить ${ml} мл воды`}
            onClick={async () => {
              setBusy(true);
              await onRecord(ml);
              setBusy(false);
            }}
            className="rounded-xl bg-water/12 py-3 text-[14px] font-bold text-water active:scale-95 disabled:opacity-50"
          >
            +{ml}
          </button>
        ))}
      </div>
      <SimpleInput type="water" label="Другой объём" suffix="мл" submitLabel="Добавить" onRecord={onRecord} resetAfter />
    </div>
  );
}

export function MetricInput({ type, dayEntries, onRecord }: { type: HealthType; dayEntries: HealthEntry[]; onRecord: Record }) {
  const single = dayEntries.at(-1)?.value ?? null;
  switch (type) {
    case "weight":
      return <SimpleInput key={String(single)} type="weight" label="Вес" suffix="кг" initial={single} submitLabel="Сохранить" onRecord={onRecord} />;
    case "steps":
      return <SimpleInput key={String(single)} type="steps" label="Шаги за день" suffix="шагов" initial={single} submitLabel="Сохранить" onRecord={onRecord} />;
    case "sleep":
      return <SleepInput key={String(single)} initial={single} onRecord={onRecord} />;
    case "water":
      return <WaterInput onRecord={onRecord} />;
    case "activity":
      return <ActivityInput onRecord={onRecord} />;
    case "measurement":
      return <MeasurementInput dayEntries={dayEntries} onRecord={onRecord} />;
  }
}
