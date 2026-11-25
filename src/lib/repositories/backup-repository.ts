import { BACKUP_APP_ID, BACKUP_FORMAT, type BackupFile, type BackupTables } from "@/lib/backup/backup-format";
import { DB_SCHEMA_VERSION, deleteCurrentDatabase, getDb } from "@/lib/db/database";
import { withDataErrors } from "@/lib/db/errors";
import { DATA_TABLES } from "@/lib/db/schemas";

const META_LAST_BACKUP = "lastBackupAt";

export const backupRepository = {
  /** Снимок всех данных в одной транзакции чтения (согласованное состояние). */
  async exportAll(): Promise<BackupFile> {
    return withDataErrors(async () => {
      const db = getDb();
      const tables = {} as BackupTables;
      await db.transaction(
        "r",
        DATA_TABLES.map((t) => db.table(t)),
        async () => {
          for (const name of DATA_TABLES) {
            (tables as Record<string, unknown[]>)[name] = await db.table(name).toArray();
          }
        },
      );
      return {
        app: BACKUP_APP_ID,
        format: BACKUP_FORMAT,
        schemaVersion: DB_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        tables,
      };
    });
  },

  /**
   * Полная замена данных содержимым резервной копии.
   * Выполняется в одной транзакции: при любой ошибке текущие данные остаются нетронутыми.
   */
  async replaceAll(backup: BackupFile): Promise<void> {
    return withDataErrors(async () => {
      const db = getDb();
      await db.transaction(
        "rw",
        DATA_TABLES.map((t) => db.table(t)),
        async () => {
          for (const name of DATA_TABLES) {
            const table = db.table(name);
            await table.clear();
            const rows = backup.tables[name];
            if (rows.length) await table.bulkAdd(rows);
          }
        },
      );
    });
  },

  async markBackupDone(): Promise<void> {
    return withDataErrors(async () => {
      await getDb().meta.put({ key: META_LAST_BACKUP, value: Date.now() });
    });
  },

  async getLastBackupAt(): Promise<number | null> {
    return withDataErrors(async () => {
      const record = await getDb().meta.get(META_LAST_BACKUP);
      return typeof record?.value === "number" ? record.value : null;
    });
  },

  async countAll(): Promise<number> {
    return withDataErrors(async () => {
      const db = getDb();
      const counts = await Promise.all(DATA_TABLES.map((t) => db.table(t).count()));
      return counts.reduce((a, b) => a + b, 0);
    });
  },

  /** Удаляет базу текущего пользователя целиком. */
  resetAll(): Promise<void> {
    return withDataErrors(() => deleteCurrentDatabase());
  },
};
