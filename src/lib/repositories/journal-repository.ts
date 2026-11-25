import { getDb } from "@/lib/db/database";
import { DataError, withDataErrors } from "@/lib/db/errors";
import { journalEntrySchema, type JournalEntry } from "@/lib/db/schemas";
import { toDayKey } from "@/lib/date";

export type JournalDraft = Omit<JournalEntry, "date" | "updatedAt">;

export const EMPTY_JOURNAL: JournalDraft = { mood: null, rating: null, wins: "", fails: "", improve: "", notes: "" };

export function isJournalEmpty(d: JournalDraft): boolean {
  return d.mood === null && d.rating === null && ![d.wins, d.fails, d.improve, d.notes].some((t) => t.trim());
}

export const journalRepository = {
  get(date: string): Promise<JournalEntry | undefined> {
    return withDataErrors(() => getDb().journalEntries.get(date));
  },

  /** Записи от новых к старым. */
  recent(limit = 60): Promise<JournalEntry[]> {
    return withDataErrors(() => getDb().journalEntries.orderBy("date").reverse().limit(limit).toArray());
  },

  between(fromKey: string, toKey: string): Promise<JournalEntry[]> {
    return withDataErrors(() => getDb().journalEntries.where("date").between(fromKey, toKey, true, true).toArray());
  },

  /** Сохранение записи дня. Полностью пустая запись удаляется, чтобы не засорять историю. */
  async save(date: string, draft: JournalDraft): Promise<void> {
    return withDataErrors(async () => {
      if (date > toDayKey(new Date())) throw new DataError("Нельзя вести дневник за будущий день.");
      const db = getDb();
      if (isJournalEmpty(draft)) {
        await db.journalEntries.delete(date);
        return;
      }
      await db.journalEntries.put(journalEntrySchema.parse({ ...draft, date, updatedAt: Date.now() }));
    });
  },

  remove(date: string): Promise<void> {
    return withDataErrors(() => getDb().journalEntries.delete(date));
  },
};
