"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ThemeMode } from "@/lib/settings/settings-store";
import { useSettings } from "@/lib/settings/use-settings";
import { useTelegram } from "@/lib/telegram/telegram-provider";
import { supportsVersion } from "@/lib/telegram/webapp";

export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function useSystemScheme(): ResolvedTheme {
  const [scheme, setScheme] = useState<ResolvedTheme>("light");
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setScheme(media.matches ? "dark" : "light");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return scheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, updateSettings] = useSettings();
  const telegram = useTelegram();
  const systemScheme = useSystemScheme();

  const mode = settings.theme;
  // «Авто»: внутри Telegram следуем теме Telegram, в браузере — теме системы
  const autoScheme: ResolvedTheme = telegram.isTelegram && telegram.colorScheme ? telegram.colorScheme : systemScheme;
  const resolved: ResolvedTheme = mode === "system" ? autoScheme : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolved);

    // Красим шапку и фон Telegram в цвета приложения, чтобы интерфейс выглядел цельно
    const webApp = telegram.webApp;
    if (webApp && supportsVersion(webApp, "6.9")) {
      const background = getComputedStyle(root).getPropertyValue("--background").trim();
      if (/^#[0-9a-f]{6}$/i.test(background)) {
        try {
          webApp.setHeaderColor(background);
          webApp.setBackgroundColor(background);
          if (supportsVersion(webApp, "7.10")) webApp.setBottomBarColor?.(background);
        } catch {
          /* клиент не поддерживает */
        }
      }
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#0a0a0c" : "#f4f4f6");
  }, [resolved, telegram.webApp]);

  const value: ThemeContextValue = {
    mode,
    resolved,
    setMode: (next) => updateSettings({ theme: next }),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
