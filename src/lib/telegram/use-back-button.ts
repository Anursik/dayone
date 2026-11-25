"use client";

import { useEffect, useRef } from "react";
import { useTelegram } from "./telegram-provider";
import { supportsVersion } from "./webapp";

/**
 * Управляет нативной кнопкой «Назад» Telegram.
 * Возвращает true, если используется нативная кнопка (тогда собственную кнопку в UI не показываем).
 */
export function useTelegramBackButton(visible: boolean, onBack: () => void): boolean {
  const { webApp } = useTelegram();
  const handlerRef = useRef(onBack);

  useEffect(() => {
    handlerRef.current = onBack;
  }, [onBack]);

  const native = supportsVersion(webApp, "6.1");

  useEffect(() => {
    if (!webApp || !native) return;
    const button = webApp.BackButton;
    const handler = () => handlerRef.current();

    if (visible) {
      button.onClick(handler);
      button.show();
    } else {
      button.hide();
    }

    return () => {
      button.offClick(handler);
    };
  }, [webApp, native, visible]);

  return native;
}
