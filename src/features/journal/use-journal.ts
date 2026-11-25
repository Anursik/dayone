"use client";

import { useLiveQuery } from "dexie-react-hooks";
import type { JournalEntry } from "@/lib/db/schemas";
import { journalRepository } from "@/lib/repositories";

export const MOODS = [
  { value: 1, emoji: "😞", label: "Плохо" },
  { value: 2, emoji: "😕", label: "Так себе" },
  { value: 3, emoji: "😐", label: "Нормально" },
  { value: 4, emoji: "🙂", label: "Хорошо" },
  { value: 5, emoji: "😄", label: "Отлично" },
] as const;

export function moodEmoji(mood: number | null): string {
  return MOODS.find((m) => m.value === mood)?.emoji ?? "·";
}

/**
 * Запись дня. null — записи нет; undefined — загрузка.
 * Результат помечен датой запроса: при смене дня live-запрос ещё какое-то время
 * отдаёт данные прошлого дня — их нельзя использовать для заполнения формы нового дня.
 */
export function useJournalEntry(date: string | null): JournalEntry | null | undefined {
  const result = useLiveQuery(async () => (date ? { date, entry: (await journalRepository.get(date)) ?? null } : undefined), [date]);
  return result && result.date === date ? result.entry : undefined;
}

export function useJournalHistory(limit = 60): JournalEntry[] | undefined {
  return useLiveQuery(() => journalRepository.recent(limit), [limit]);
}
