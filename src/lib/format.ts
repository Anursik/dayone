const numberFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

export function formatLiters(ml: number): string {
  return `${(ml / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} л`;
}

/** Склонение: plural(5, ["привычка", "привычки", "привычек"]) */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}
