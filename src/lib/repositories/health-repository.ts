import { getDb } from "@/lib/db/database";
import { DataError, withDataErrors } from "@/lib/db/errors";
import { createId } from "@/lib/db/ids";
import { healthEntrySchema, PROFILE_ID, type HealthEntry, type HealthType } from "@/lib/db/schemas";
import { toDayKey } from "@/lib/date";
import { METRICS } from "@/lib/health/metrics";

type Details = Record<string, string | number> | null;

function assertValid(type: HealthType, date: string, value: number) {
  if (date > toDayKey(new Date())) throw new DataError("Нельзя добавить запись на будущий день.");
  const m = METRICS[type];
  if (!Number.isFinite(value) || value < m.min || value > m.max) {
    throw new DataError(`${m.label}: допустимо от ${m.min} до ${m.max} ${m.unit}.`);
  }
}

/** Ключ «одного значения в день»: для замеров — отдельно по каждой части тела. */
function sameSlot(a: HealthEntry, details: Details) {
  if (a.type !== "measurement") return true;
  return a.details?.part === details?.part;
}

export const healthRepository = {
  entriesForDay(date: string): Promise<HealthEntry[]> {
    return withDataErrors(() => getDb().healthEntries.where("date").equals(date).sortBy("createdAt"));
  },

  entriesBetween(type: HealthType, fromKey: string, toKey: string): Promise<HealthEntry[]> {
    return withDataErrors(() =>
      getDb().healthEntries.where("[type+date]").between([type, fromKey], [type, toKey], true, true).toArray(),
    );
  },

  /** Все записи показателя, от новых к старым. */
  async history(type: HealthType, limit = 400): Promise<HealthEntry[]> {
    return withDataErrors(async () => {
      const list = await getDb().healthEntries.where("type").equals(type).toArray();
      return list.sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1)).slice(0, limit);
    });
  },

  /**
   * Запись показателя за день.
   * Для «одного значения в день» (вес, сон, шаги, замер части тела) заменяет прежнее значение,
   * для суммируемых (вода, активность) добавляет новую запись.
   * Вес за самый свежий день также обновляет текущий вес в профиле.
   */
  async record(type: HealthType, date: string, value: number, details: Details = null): Promise<HealthEntry> {
    return withDataErrors(async () => {
      assertValid(type, date, value);
      const db = getDb();
      return db.transaction("rw", db.healthEntries, db.profile, async () => {
        const entry = healthEntrySchema.parse({ id: createId(), type, date, value, details, createdAt: Date.now() });
        if (METRICS[type].mode === "daily") {
          const existing = (await db.healthEntries.where("[type+date]").equals([type, date]).toArray()).filter((e) => sameSlot(e, details));
          if (existing.length) await db.healthEntries.bulkDelete(existing.map((e) => e.id));
        }
        await db.healthEntries.add(entry);

        if (type === "weight") {
          const newer = await db.healthEntries.where("[type+date]").between(["weight", date], ["weight", "￿"], false, true).count();
          if (newer === 0) {
            const profile = await db.profile.get(PROFILE_ID);
            if (profile) await db.profile.put({ ...profile, weightKg: Math.round(value * 10) / 10, updatedAt: Date.now() });
          }
        }
        return entry;
      });
    });
  },

  remove(id: string): Promise<void> {
    return withDataErrors(() => getDb().healthEntries.delete(id));
  },
};
