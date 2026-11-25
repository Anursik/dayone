/** Разбор числа из поля ввода (допускается запятая). null — пусто или не число. */
export function parseDecimal(raw: string): number | null {
  const text = raw.trim().replace(",", ".").replace(/\s/g, "");
  if (!text || !/^\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

export function validateRange(raw: string, min: number, max: number, { required = true } = {}): { value: number | null; error: string | null } {
  if (!raw.trim()) return { value: null, error: required ? "Обязательное поле" : null };
  const value = parseDecimal(raw);
  if (value === null) return { value: null, error: "Введите число" };
  if (value < min || value > max) return { value: null, error: `От ${min} до ${max}` };
  return { value, error: null };
}

export function formatDecimal(value: number, digits = 1): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits).replace(/\.?0+$/, "").replace(".", ",");
}
