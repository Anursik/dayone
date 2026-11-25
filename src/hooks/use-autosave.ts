"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

/**
 * Автосохранение: значение сохраняется через `delay` мс после последнего изменения.
 * Несохранённые изменения принудительно записываются при сворачивании/закрытии
 * Telegram (visibilitychange, pagehide) и при уходе с экрана.
 *
 * `version` — счётчик изменений пользователя; сохранение запускается только при его росте,
 * поэтому загрузка исходных данных не вызывает лишней записи.
 */
export function useAutosave<T>(
  value: T,
  version: number,
  save: (value: T) => Promise<void>,
  { delay = 500 }: { delay?: number } = {},
): { status: AutosaveStatus; flush: () => Promise<void> } {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const valueRef = useRef(value);
  const saveRef = useRef(save);
  const savedVersion = useRef(version);
  const latestVersion = useRef(version);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    valueRef.current = value;
    saveRef.current = save;
    latestVersion.current = version;
  });

  const flush = useCallback(async () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const target = latestVersion.current;
    if (target === savedVersion.current) return;
    savedVersion.current = target;
    setStatus("saving");
    try {
      await saveRef.current(valueRef.current);
      setStatus(latestVersion.current === target ? "saved" : "pending");
    } catch {
      savedVersion.current = -1; // повторить при следующем изменении или сворачивании
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (version === savedVersion.current) return;
    const id = window.setTimeout(() => {
      setStatus("pending");
    }, 0);
    timer.current = window.setTimeout(() => void flush(), delay);
    return () => {
      window.clearTimeout(id);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [version, delay, flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onPageHide = () => void flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      void flush(); // уход с экрана
    };
  }, [flush]);

  return { status, flush };
}
