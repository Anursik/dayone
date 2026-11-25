import type { Table } from "dexie";
import type { z } from "zod";
import { getDb, type DayoneDatabase } from "@/lib/db/database";
import { withDataErrors } from "@/lib/db/errors";
import type { DataTableName } from "@/lib/db/schemas";

type KeyOf<T> = string & keyof T;

/**
 * Базовый репозиторий: чтение и запись одной таблицы с проверкой каждой записи схемой Zod.
 * Каждая запись сразу сохраняется в IndexedDB (без отложенных буферов) — данные не теряются
 * при закрытии Telegram. UI работает только через репозитории и не знает о Dexie.
 */
export function createRepository<T, K extends KeyOf<T>>(tableName: DataTableName, schema: z.ZodType<T>, keyPath: K) {
  const table = () => (getDb() as DayoneDatabase)[tableName] as unknown as Table<T, T[K]>;

  return {
    tableName,
    keyPath,
    table,

    list(): Promise<T[]> {
      return withDataErrors(() => table().toArray());
    },

    get(key: T[K]): Promise<T | undefined> {
      return withDataErrors(() => table().get(key as never));
    },

    async put(entity: T): Promise<T> {
      return withDataErrors(async () => {
        const valid = schema.parse(entity);
        await table().put(valid);
        return valid;
      });
    },

    async bulkPut(entities: T[]): Promise<void> {
      return withDataErrors(async () => {
        const valid = entities.map((e) => schema.parse(e));
        await table().bulkPut(valid);
      });
    },

    remove(key: T[K]): Promise<void> {
      return withDataErrors(() => table().delete(key as never));
    },

    count(): Promise<number> {
      return withDataErrors(() => table().count());
    },
  };
}
