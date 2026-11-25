"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TelegramColorScheme, TelegramWebApp, TelegramWebAppUser } from "./types";
import { supportsVersion, waitForTelegramWebApp } from "./webapp";

export interface TelegramState {
  /** true, когда проверка окружения завершена */
  initialized: boolean;
  /** true, если приложение открыто внутри Telegram */
  isTelegram: boolean;
  webApp: TelegramWebApp | null;
  /**
   * Пользователь из initDataUnsafe. Это НЕ проверенная сервером идентификация —
   * используется только как начальные данные профиля (имя, аватар).
   */
  user: TelegramWebAppUser | null;
  colorScheme: TelegramColorScheme | null;
  platform: string;
  version: string | null;
}

const initialState: TelegramState = {
  initialized: false,
  isTelegram: false,
  webApp: null,
  user: null,
  colorScheme: null,
  platform: "browser",
  version: null,
};

const TelegramContext = createContext<TelegramState>(initialState);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TelegramState>(initialState);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    waitForTelegramWebApp().then((webApp) => {
      if (cancelled) return;

      if (!webApp) {
        setState({ ...initialState, initialized: true });
        return;
      }

      try {
        webApp.ready();
        webApp.expand();
        // Чтобы вертикальный скролл не сворачивал мини-приложение (Bot API 7.7+)
        if (supportsVersion(webApp, "7.7")) webApp.disableVerticalSwipes?.();
      } catch {
        /* старый клиент */
      }

      const sync = () =>
        setState({
          initialized: true,
          isTelegram: true,
          webApp,
          user: webApp.initDataUnsafe?.user ?? null,
          colorScheme: webApp.colorScheme,
          platform: webApp.platform,
          version: webApp.version,
        });

      sync();
      webApp.onEvent("themeChanged", sync);
      cleanup = () => webApp.offEvent("themeChanged", sync);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <TelegramContext.Provider value={state}>{children}</TelegramContext.Provider>;
}

export function useTelegram() {
  return useContext(TelegramContext);
}
