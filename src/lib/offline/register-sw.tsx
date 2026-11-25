"use client";

import { useEffect } from "react";

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/**
 * Регистрирует service worker в production-сборке: после первого открытия
 * приложение запускается без интернета. Если браузер/WebView не поддерживает
 * service worker, приложение просто работает онлайн как обычно.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch(() => {
        /* без офлайн-кэша приложение продолжает работать онлайн */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
