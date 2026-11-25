import type { TelegramWebApp } from "./types";

export const TELEGRAM_SCRIPT_URL = "https://telegram.org/js/telegram-web-app.js";

/**
 * Возвращает объект WebApp только если приложение действительно открыто внутри Telegram.
 * Скрипт telegram-web-app.js создаёт window.Telegram.WebApp и в обычном браузере,
 * поэтому признак запуска в Telegram — наличие initData или платформы, отличной от "unknown".
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return null;
  const insideTelegram = Boolean(webApp.initData) || (webApp.platform && webApp.platform !== "unknown");
  return insideTelegram ? webApp : null;
}

/** Ждёт загрузки скрипта Telegram (он подключается асинхронно), но не дольше timeoutMs. */
export function waitForTelegramWebApp(timeoutMs = 2500): Promise<TelegramWebApp | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    if (window.Telegram?.WebApp) return resolve(getTelegramWebApp());

    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.Telegram?.WebApp) {
        window.clearInterval(timer);
        resolve(getTelegramWebApp());
      } else if (Date.now() - started > timeoutMs) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 50);
  });
}

export function supportsVersion(webApp: TelegramWebApp | null, version: string): boolean {
  if (!webApp) return false;
  try {
    return webApp.isVersionAtLeast(version);
  } catch {
    return false;
  }
}
