/** Поиск продуктов по названию: без учёта регистра и «ё», по началу слов и подстроке. */

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}%]+/gu, " ").trim();
}

/**
 * Оценка совпадения (больше — лучше), 0 — не подходит.
 * Все слова запроса должны встречаться в названии.
 */
export function matchScore(name: string, query: string): number {
  const q = normalizeText(query);
  if (!q) return 0;
  const n = normalizeText(name);
  const tokens = q.split(" ");
  const words = n.split(" ");
  let score = 0;

  for (const token of tokens) {
    if (words.some((w) => w === token)) score += 4;
    else if (words.some((w) => w.startsWith(token))) score += 3;
    else if (n.includes(token)) score += 1;
    else return 0;
  }
  if (n.startsWith(q)) score += 5;
  // Короткие названия («Гречка») выше длинных («Гречка с грибами») при равных совпадениях
  return score + 1 / (1 + n.length / 20);
}

export function searchByName<T extends { name: string }>(items: T[], query: string, limit = 50): T[] {
  return items
    .map((item) => ({ item, score: matchScore(item.name, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}
