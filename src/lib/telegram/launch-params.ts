/**
 * Telegram передаёт параметры запуска в URL (#tgWebAppData=...) и сохраняет их в sessionStorage.
 * Читаем ID пользователя напрямую, чтобы выбрать нужную локальную базу даже тогда,
 * когда скрипт telegram-web-app.js ещё не загрузился или недоступен без интернета.
 * Значение НЕ проверено сервером и используется только для разделения данных на устройстве.
 */
function userIdFromInitData(initData: string | null | undefined): number | null {
  if (!initData) return null;
  try {
    const user = new URLSearchParams(initData).get("user");
    if (!user) return null;
    const id = Number(JSON.parse(user).id);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function readLaunchUserId(): number | null {
  if (typeof window === "undefined") return null;

  const fromSdk = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (typeof fromSdk === "number" && fromSdk > 0) return fromSdk;

  try {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const fromHash = userIdFromInitData(hash.get("tgWebAppData"));
    if (fromHash) return fromHash;
  } catch {
    /* некорректный hash */
  }

  try {
    const stored = window.sessionStorage.getItem("__telegram__initParams");
    if (stored) {
      const params = JSON.parse(stored) as { tgWebAppData?: string };
      return userIdFromInitData(params.tgWebAppData);
    }
  } catch {
    /* sessionStorage недоступен */
  }

  return null;
}
