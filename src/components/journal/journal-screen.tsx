"use client";

import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { Card } from "@/components/ui/card";
import { DayNavigator } from "@/components/ui/day-navigator";
import { SectionTitle } from "@/components/ui/section-title";
import { MOODS, moodEmoji, useJournalEntry, useJournalHistory } from "@/features/journal/use-journal";
import { useAutosave, type AutosaveStatus } from "@/hooks/use-autosave";
import { useNow } from "@/hooks/use-now";
import type { JournalEntry } from "@/lib/db/schemas";
import { toDataError } from "@/lib/db/errors";
import { formatLongDate, fromDayKey, toDayKey } from "@/lib/date";
import { EMPTY_JOURNAL, journalRepository, type JournalDraft } from "@/lib/repositories";
import { haptics } from "@/lib/telegram/haptics";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const PROMPTS: { key: keyof Pick<JournalDraft, "wins" | "fails" | "improve" | "notes">; label: string; placeholder: string }[] = [
  { key: "wins", label: "Что получилось сегодня?", placeholder: "Маленькие и большие победы" },
  { key: "fails", label: "Что не получилось?", placeholder: "Без самокритики — просто факты" },
  { key: "improve", label: "Что улучшить завтра?", placeholder: "Один конкретный шаг" },
  { key: "notes", label: "Личные заметки", placeholder: "Мысли, идеи, события дня" },
];

function SaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;
  return (
    <span role="status" className="mb-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
      {status === "error" ? (
        <>
          <CircleAlert className="size-4 text-destructive" /> Ошибка
        </>
      ) : status === "saved" ? (
        <>
          <Check className="size-4 text-health" /> Сохранено
        </>
      ) : (
        <>
          <LoaderCircle className="size-4 animate-spin" /> Сохранение
        </>
      )}
    </span>
  );
}

function toDraft(entry: JournalEntry | null): JournalDraft {
  if (!entry) return { ...EMPTY_JOURNAL };
  return { mood: entry.mood, rating: entry.rating, wins: entry.wins, fails: entry.fails, improve: entry.improve, notes: entry.notes };
}

function JournalForm({ dayKey, entry, onStatus }: { dayKey: string; entry: JournalEntry | null; onStatus: (s: AutosaveStatus) => void }) {
  const [draft, setDraft] = useState<JournalDraft>(() => toDraft(entry));
  const [version, setVersion] = useState(0);

  const save = useCallback(
    async (value: JournalDraft) => {
      try {
        await journalRepository.save(dayKey, value);
      } catch (error) {
        toast(toDataError(error).userMessage, "error");
        throw error;
      }
    },
    [dayKey],
  );
  const { status } = useAutosave(draft, version, save, { delay: 700 });
  // Статус показывается в заголовке экрана
  useEffect(() => {
    onStatus(status);
  }, [status, onStatus]);

  const set = (patch: Partial<JournalDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setVersion((v) => v + 1);
  };

  return (
    <>
      <Card>
        <p className="mb-3 text-[14px] font-semibold">
          Настроение
          {draft.mood ? <span className="text-muted-foreground"> · {MOODS.find((m) => m.value === draft.mood)?.label}</span> : null}
        </p>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Настроение">
          {MOODS.map((m) => {
            const active = draft.mood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={m.label}
                onClick={() => {
                  haptics.selection();
                  set({ mood: active ? null : m.value });
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-all",
                  active ? "bg-journal/18 ring-2 ring-journal" : "bg-muted opacity-75",
                )}
              >
                <span className={cn("text-[28px] leading-none transition-transform", active && "scale-110")}>{m.emoji}</span>
                <span className="hidden text-[10.5px] font-semibold text-muted-foreground min-[400px]:block">{m.label}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 mb-3 text-[14px] font-semibold">
          Оценка дня{draft.rating ? <span className="text-muted-foreground"> · {draft.rating} из 10</span> : null}
        </p>
        <div className="grid grid-cols-10 gap-1" role="radiogroup" aria-label="Оценка дня">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const active = draft.rating === n;
            const filled = draft.rating !== null && n <= draft.rating;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`Оценка ${n}`}
                onClick={() => {
                  haptics.selection();
                  set({ rating: active ? null : n });
                }}
                className={cn("tabular h-10 rounded-xl text-[14px] font-bold transition-colors", filled ? "bg-journal text-white" : "bg-muted text-muted-foreground")}
              >
                {n}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mt-3 space-y-4">
        {PROMPTS.map((p) => (
          <AutoTextarea key={p.key} label={p.label} placeholder={p.placeholder} value={draft[p.key]} maxLength={p.key === "notes" ? 20000 : 5000} onChange={(e) => set({ [p.key]: e.target.value })} />
        ))}
      </Card>
      <p className="mt-3 px-1 text-[12.5px] text-muted-foreground">Записи сохраняются автоматически и видны только на этом устройстве.</p>
    </>
  );
}

export function JournalScreen() {
  const now = useNow();
  const todayKey = now ? toDayKey(now) : null;
  const [picked, setPicked] = useState<string | null>(null);
  const dayKey = picked && todayKey && picked <= todayKey ? picked : todayKey;
  const entry = useJournalEntry(dayKey);
  const history = useJournalHistory();
  const [status, setStatus] = useState<AutosaveStatus>("idle");

  return (
    <>
      <PageHeader title="Дневник" backHref="/profile" action={<SaveIndicator status={status} />} />
      {!todayKey || !dayKey || entry === undefined ? (
        <div className="min-h-[60dvh]" aria-busy="true" />
      ) : (
        <>
          <DayNavigator
            dayKey={dayKey}
            todayKey={todayKey}
            onChange={(k) => {
              setStatus("idle");
              setPicked(k);
            }}
          />
          {/* key по дате: при смене дня черновик прошлого дня сохраняется и форма загружает новый */}
          <JournalForm key={dayKey} dayKey={dayKey} entry={entry} onStatus={setStatus} />

          {history && history.filter((h) => h.date !== dayKey).length ? (
            <>
              <SectionTitle>Прошлые записи</SectionTitle>
              <Card className="p-0">
                <ul className="divide-y divide-border">
                  {history
                    .filter((h) => h.date !== dayKey)
                    .slice(0, 30)
                    .map((h) => {
                      const snippet = [h.wins, h.notes, h.improve, h.fails].find((t) => t.trim()) ?? "";
                      return (
                        <li key={h.date}>
                          <button
                            type="button"
                            onClick={() => {
                              haptics.selection();
                              setStatus("idle");
                              setPicked(h.date);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted"
                          >
                            <span className="text-[24px] leading-none" aria-hidden>
                              {moodEmoji(h.mood)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[14.5px] font-semibold">
                                {formatLongDate(fromDayKey(h.date))}
                                {h.rating ? <span className="font-medium text-muted-foreground"> · {h.rating}/10</span> : null}
                              </span>
                              {snippet ? <span className="block truncate text-[13px] text-muted-foreground">{snippet}</span> : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </Card>
            </>
          ) : null}
        </>
      )}
    </>
  );
}
