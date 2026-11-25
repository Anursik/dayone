"use client";

import { useSyncExternalStore } from "react";

/**
 * Значения CSS-токенов для графиков (Recharts рисует SVG и принимает готовые цвета).
 * Пересчитываются при смене темы (атрибут data-theme на <html>).
 */
export function useChartTokens(seriesVar: string) {
  const raw = useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => obs.disconnect();
    },
    () => {
      const s = getComputedStyle(document.documentElement);
      const v = (n: string) => s.getPropertyValue(n).trim();
      return [v(seriesVar), v("--muted-foreground"), v("--border"), v("--card"), v("--muted")].join("|");
    },
    () => "#2f7bff|#6c6c78|rgba(0,0,0,0.07)|#ffffff|#ececf0",
  );
  const [series, text, grid, surface, track] = raw.split("|");
  return { series, text, grid, surface, track };
}

/** Мышь — подсказка при наведении; сенсорный экран — по касанию. */
export function useCanHover(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(hover: hover)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(hover: hover)").matches,
    () => false,
  );
}
