"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { backupFileName, parseBackup, type BackupFile } from "@/lib/backup/backup-format";
import { toDataError } from "@/lib/db/errors";
import { SETTINGS_STORAGE_KEY } from "@/lib/settings/settings-store";
import { backupRepository } from "@/lib/repositories";

export type DeliveryMethod = "download" | "share" | "copy";

function serialize(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}

export function canShareFiles(): boolean {
  try {
    if (typeof navigator === "undefined" || !navigator.canShare) return false;
    const probe = new File(["{}"], "probe.json", { type: "application/json" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

async function deliver(text: string, method: DeliveryMethod): Promise<void> {
  const fileName = backupFileName();

  if (method === "copy") {
    await navigator.clipboard.writeText(text);
    return;
  }

  const file = new File([text], fileName, { type: "application/json" });

  if (method === "share") {
    await navigator.share({ files: [file], title: "Резервная копия DAYONE" });
    return;
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function useBackup() {
  const lastBackupAt = useLiveQuery(() => backupRepository.getLastBackupAt(), []);
  const totalRecords = useLiveQuery(() => backupRepository.countAll(), []);

  const exportData = useCallback(async (method: DeliveryMethod) => {
    const backup = await backupRepository.exportAll();
    try {
      await deliver(serialize(backup), method);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error; // пользователь закрыл «Поделиться»
      throw new Error(
        method === "copy"
          ? "Не удалось скопировать: буфер обмена недоступен."
          : method === "share"
            ? "Не удалось открыть меню «Поделиться»."
            : "Не удалось сохранить файл.",
      );
    }
    await backupRepository.markBackupDone();
  }, []);

  const importData = useCallback(async (backup: BackupFile) => {
    try {
      await backupRepository.replaceAll(backup);
    } catch (error) {
      throw toDataError(error);
    }
  }, []);

  const resetApp = useCallback(async () => {
    await backupRepository.resetAll();
    try {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch {
      /* хранилище недоступно */
    }
  }, []);

  return { lastBackupAt, totalRecords, exportData, importData, resetApp, parseBackup };
}
