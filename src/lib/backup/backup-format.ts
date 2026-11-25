import { z } from "zod";
import { DATA_TABLES, TABLE_LABELS, TABLE_SCHEMAS, type DataTableName } from "@/lib/db/schemas";

/**
 * Формат резервной копии DAYONE (JSON).
 * BACKUP_FORMAT увеличивается при несовместимых изменениях; старые файлы
 * приводятся к текущему формату в migrateBackup().
 */
export const BACKUP_APP_ID = "DAYONE";
export const BACKUP_FORMAT = 1;
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

export type BackupTables = { [K in DataTableName]: z.infer<(typeof TABLE_SCHEMAS)[K]>[] };

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  format: number;
  schemaVersion: number;
  exportedAt: string;
  tables: BackupTables;
}

export type ParseResult =
  | { ok: true; backup: BackupFile; counts: Record<DataTableName, number>; total: number }
  | { ok: false; error: string };

const headerSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  format: z.number().int().positive(),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  tables: z.record(z.string(), z.unknown()),
});

/** Приведение резервных копий старых форматов к текущему. Пока существует только формат 1. */
function migrateBackup(raw: z.infer<typeof headerSchema>): z.infer<typeof headerSchema> {
  return raw;
}

function keyOf(table: DataTableName, record: Record<string, unknown>): string {
  if (table === "journalEntries") return String(record.date);
  if (table === "habitLogs") return `${record.habitId}|${record.date}`;
  return String(record.id);
}

export function parseBackup(text: string): ParseResult {
  if (new Blob([text]).size > MAX_BACKUP_BYTES) {
    return { ok: false, error: "Файл слишком большой для резервной копии DAYONE." };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "Это не JSON-файл или он повреждён." };
  }

  const header = headerSchema.safeParse(json);
  if (!header.success) {
    return { ok: false, error: "Файл не похож на резервную копию DAYONE." };
  }
  if (header.data.format > BACKUP_FORMAT) {
    return { ok: false, error: "Копия создана более новой версией DAYONE. Обновите приложение и повторите." };
  }

  const migrated = migrateBackup(header.data);
  const tables = {} as BackupTables;
  const counts = {} as Record<DataTableName, number>;
  let total = 0;

  for (const name of DATA_TABLES) {
    const rawTable = migrated.tables[name] ?? [];
    if (!Array.isArray(rawTable)) {
      return { ok: false, error: `Раздел «${TABLE_LABELS[name]}» повреждён.` };
    }

    const schema = TABLE_SCHEMAS[name];
    const seen = new Set<string>();
    const records: unknown[] = [];

    for (let i = 0; i < rawTable.length; i++) {
      const parsed = schema.safeParse(rawTable[i]);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const field = issue?.path.length ? `, поле «${issue.path.join(".")}»` : "";
        return {
          ok: false,
          error: `Раздел «${TABLE_LABELS[name]}», запись ${i + 1}${field}: ${issue?.message ?? "неверный формат"}.`,
        };
      }
      const key = keyOf(name, parsed.data as Record<string, unknown>);
      if (seen.has(key)) {
        return { ok: false, error: `Раздел «${TABLE_LABELS[name]}» содержит повторяющиеся записи.` };
      }
      seen.add(key);
      records.push(parsed.data);
    }

    if (name === "profile" && records.length > 1) {
      return { ok: false, error: "В копии больше одного профиля." };
    }

    (tables as Record<string, unknown[]>)[name] = records;
    counts[name] = records.length;
    total += records.length;
  }

  return {
    ok: true,
    backup: {
      app: BACKUP_APP_ID,
      format: BACKUP_FORMAT,
      schemaVersion: migrated.schemaVersion,
      exportedAt: migrated.exportedAt,
      tables,
    },
    counts,
    total,
  };
}

export function backupFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `dayone-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}.json`;
}
