"use client";

import { useEffect, useState } from "react";

/**
 * Текущее время на устройстве пользователя.
 * Возвращает null при статическом пререндере и до гидратации —
 * дата на экране всегда берётся из локального часового пояса, а не из времени сборки.
 * Обновляется раз в минуту, чтобы «сегодня» корректно сменялось после полуночи.
 */
export function useNow(intervalMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Первое значение выставляем асинхронно: на сервере даты нет, на клиенте — локальная
    const first = window.setTimeout(() => setNow(new Date()), 0);
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(new Date());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return now;
}
