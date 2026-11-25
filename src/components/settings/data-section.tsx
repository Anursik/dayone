"use client";

import { ClipboardPaste, Copy, Download, FileUp, HardDrive, Share2, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ListGroup, ListRow } from "@/components/ui/list-row";
import { SectionTitle } from "@/components/ui/section-title";
import { Sheet } from "@/components/ui/sheet";
import { canShareFiles, useBackup, type DeliveryMethod } from "@/features/backup/use-backup";
import type { ParseResult } from "@/lib/backup/backup-format";
import { useDatabaseInfo } from "@/lib/db/database-provider";
import { toDataError } from "@/lib/db/errors";
import { DATA_TABLES, TABLE_LABELS } from "@/lib/db/schemas";
import { formatNumber, plural } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { toast } from "@/lib/toast";

const dateTime = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

function records(n: number) {
  return `${formatNumber(n)} ${plural(n, ["запись", "записи", "записей"])}`;
}

function ActionButton({ icon, children, ...props }: { icon: ReactNode } & React.ComponentProps<typeof Button>) {
  return (
    <Button size="lg" variant="secondary" className="justify-start gap-3" {...props}>
      {icon}
      {children}
    </Button>
  );
}

/* ───────── Экспорт ───────── */

function ExportSheet({ open, onOpenChange, total }: { open: boolean; onOpenChange: (o: boolean) => void; total: number }) {
  const { exportData } = useBackup();
  const [busy, setBusy] = useState<DeliveryMethod | null>(null);
  const shareSupported = canShareFiles();

  const run = async (method: DeliveryMethod) => {
    setBusy(method);
    try {
      await exportData(method);
      haptics.notify("success");
      toast(method === "copy" ? "Копия скопирована в буфер обмена" : "Резервная копия создана", "success");
      onOpenChange(false);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        haptics.notify("error");
        toast(error instanceof Error ? error.message : toDataError(error).userMessage, "error");
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Экспорт данных"
      description={`В копию попадут все данные (${records(total)}) в формате JSON.`}
    >
      <div className="space-y-2.5 pb-2">
        <ActionButton icon={<Download />} disabled={busy !== null} onClick={() => run("download")}>
          Сохранить файл
        </ActionButton>
        {shareSupported ? (
          <ActionButton icon={<Share2 />} disabled={busy !== null} onClick={() => run("share")}>
            Поделиться файлом
          </ActionButton>
        ) : null}
        <ActionButton icon={<Copy />} disabled={busy !== null} onClick={() => run("copy")}>
          Скопировать как текст
        </ActionButton>
        <p className="px-1 pt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          Если файл не сохранился (так бывает в Telegram на iPhone), используйте «Поделиться» или скопируйте текст и
          отправьте его себе в «Избранное».
        </p>
      </div>
    </Sheet>
  );
}

/* ───────── Импорт ───────── */

function ImportSheet({ open, onOpenChange, currentTotal }: { open: boolean; onOpenChange: (o: boolean) => void; currentTotal: number }) {
  const { parseBackup, importData } = useBackup();
  const fileInput = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setResult(null);
    setPasteMode(false);
    setPasted("");
  };

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) reset();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setResult(parseBackup(await file.text()));
    } catch {
      setResult({ ok: false, error: "Не удалось прочитать файл." });
    }
  };

  const confirm = async () => {
    if (!result?.ok) return;
    setBusy(true);
    try {
      await importData(result.backup);
      haptics.notify("success");
      toast(`Данные восстановлены: ${records(result.total)}`, "success");
      close(false);
    } catch (error) {
      haptics.notify("error");
      toast(toDataError(error).userMessage, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={close}
      title="Импорт данных"
      description="Восстановление из резервной копии DAYONE (JSON)."
    >
      <div className="space-y-2.5 pb-2">
        {!result ? (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json,text/plain"
              className="hidden"
              data-testid="import-file"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <ActionButton icon={<FileUp />} onClick={() => fileInput.current?.click()}>
              Выбрать файл
            </ActionButton>
            {pasteMode ? (
              <div className="space-y-2.5">
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder="Вставьте сюда текст резервной копии"
                  aria-label="Текст резервной копии"
                  className="h-36 w-full resize-none rounded-2xl bg-muted p-4 font-mono text-[12px] outline-none focus:ring-2 focus:ring-ring"
                />
                <Button size="lg" disabled={!pasted.trim()} onClick={() => setResult(parseBackup(pasted))}>
                  Проверить
                </Button>
              </div>
            ) : (
              <ActionButton icon={<ClipboardPaste />} onClick={() => setPasteMode(true)}>
                Вставить текст
              </ActionButton>
            )}
          </>
        ) : result.ok ? (
          <>
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-[14px] font-semibold">Копия проверена</p>
              <p className="text-[13px] text-muted-foreground">
                {(() => {
                  const d = new Date(result.backup.exportedAt);
                  return Number.isNaN(d.getTime()) ? "" : `Создана ${dateTime.format(d)} · `;
                })()}
                {records(result.total)}
              </p>
              <ul className="mt-3 space-y-1">
                {DATA_TABLES.filter((t) => result.counts[t] > 0).map((t) => (
                  <li key={t} className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">{TABLE_LABELS[t]}</span>
                    <span className="tabular font-semibold">{formatNumber(result.counts[t])}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-destructive/10 p-4 text-[13.5px] leading-snug text-destructive">
              Все текущие данные на этом устройстве ({records(currentTotal)}) будут заменены содержимым копии. Это
              нельзя отменить — при необходимости сначала сделайте экспорт.
            </div>
            <Button size="lg" variant="destructive" disabled={busy} onClick={confirm}>
              <Upload />
              {busy ? "Восстановление…" : "Заменить данные"}
            </Button>
            <Button size="lg" variant="ghost" disabled={busy} onClick={reset}>
              Выбрать другой файл
            </Button>
          </>
        ) : (
          <>
            <div role="alert" className="rounded-2xl bg-destructive/10 p-4 text-[14px] leading-snug text-destructive">
              {result.error}
            </div>
            <Button size="lg" variant="secondary" onClick={reset}>
              Попробовать снова
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* ───────── Сброс ───────── */

function ResetSheet({ open, onOpenChange, total }: { open: boolean; onOpenChange: (o: boolean) => void; total: number }) {
  const { resetApp } = useBackup();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await resetApp();
      haptics.notify("warning");
      window.location.replace(`${window.location.pathname.replace(/profile\/settings\/?$/, "")}`);
    } catch (error) {
      setBusy(false);
      toast(toDataError(error).userMessage, "error");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Сбросить приложение?">
      <div className="space-y-2.5 pb-2">
        <p className="text-[14.5px] leading-relaxed text-muted-foreground">
          Будут безвозвратно удалены все данные на этом устройстве ({records(total)}): профиль, привычки, питание,
          тренировки, здоровье, дневник и настройки. Данные других пользователей Telegram на этом устройстве не
          затрагиваются.
        </p>
        <Button size="lg" variant="destructive" disabled={busy} onClick={run}>
          <Trash2 />
          {busy ? "Удаление…" : "Удалить все данные"}
        </Button>
        <Button size="lg" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
          Отмена
        </Button>
      </div>
    </Sheet>
  );
}

/* ───────── Раздел ───────── */

export function DataSection() {
  const { lastBackupAt, totalRecords } = useBackup();
  const db = useDatabaseInfo();
  const [sheet, setSheet] = useState<"export" | "import" | "reset" | null>(null);
  const total = totalRecords ?? 0;
  const openSheet = (s: typeof sheet) => () => setSheet(s);
  const setOpen = (s: NonNullable<typeof sheet>) => (o: boolean) => setSheet(o ? s : null);

  const persisted = db.status === "ready" ? db.persisted : null;

  return (
    <>
      <SectionTitle>Данные</SectionTitle>
      <ListGroup>
        <ListRow
          icon={HardDrive}
          title="Хранилище"
          subtitle={
            persisted === true
              ? "Защищено от автоочистки"
              : persisted === false
                ? "Браузер может очистить при нехватке места"
                : "Локально на устройстве"
          }
          trailing={<span className="text-[14px] text-muted-foreground">{records(total)}</span>}
        />
        <ListRow
          icon={Download}
          title="Последняя копия"
          trailing={
            <span className="text-right text-[14px] text-muted-foreground">
              {lastBackupAt ? dateTime.format(new Date(lastBackupAt)) : "Не создавалась"}
            </span>
          }
        />
      </ListGroup>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <Button size="md" variant="secondary" className="h-12" onClick={openSheet("export")}>
          <Download />
          Экспорт
        </Button>
        <Button size="md" variant="secondary" className="h-12" onClick={openSheet("import")}>
          <Upload />
          Импорт
        </Button>
      </div>
      <Button size="lg" variant="destructive" className="mt-2.5" onClick={openSheet("reset")}>
        <Trash2 />
        Сбросить приложение
      </Button>

      <ExportSheet open={sheet === "export"} onOpenChange={setOpen("export")} total={total} />
      <ImportSheet open={sheet === "import"} onOpenChange={setOpen("import")} currentTotal={total} />
      <ResetSheet open={sheet === "reset"} onOpenChange={setOpen("reset")} total={total} />
    </>
  );
}
