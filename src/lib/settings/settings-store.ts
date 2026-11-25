import { z } from "zod";

/**
 * Настройки и предпочтения хранятся в LocalStorage (основные данные — в IndexedDB, этап 2).
 * Структура проверяется Zod: повреждённые или устаревшие значения заменяются значениями по умолчанию.
 */

export const SETTINGS_STORAGE_KEY = "dayone:settings";

export const themeModeSchema = z.enum(["system", "light", "dark"]);
export type ThemeMode = z.infer<typeof themeModeSchema>;

export const settingsSchema = z.object({
  version: z.literal(1),
  theme: themeModeSchema,
  language: z.literal("ru"),
  hapticsEnabled: z.boolean(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  theme: "system",
  language: "ru",
  hapticsEnabled: true,
};

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: Settings | null = null;

function readFromStorage(): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = settingsSchema.partial().safeParse(JSON.parse(raw));
    if (!parsed.success) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...parsed.data, version: 1, language: "ru" };
  } catch {
    // LocalStorage может быть недоступен (приватный режим, ограничения WebView)
    return DEFAULT_SETTINGS;
  }
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  if (!cache) cache = readFromStorage();
  return cache;
}

export function getServerSettings(): Settings {
  return DEFAULT_SETTINGS;
}

export function updateSettings(patch: Partial<Omit<Settings, "version" | "language">>): Settings {
  const next = settingsSchema.parse({ ...getSettings(), ...patch });
  cache = next;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* хранилище недоступно — настройки будут действовать до перезапуска */
  }
  listeners.forEach((l) => l());
  return next;
}

export function subscribeSettings(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_STORAGE_KEY) {
      cache = readFromStorage();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
