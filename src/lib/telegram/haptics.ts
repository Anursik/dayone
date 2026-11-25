import { getSettings } from "@/lib/settings/settings-store";
import { getTelegramWebApp, supportsVersion } from "./webapp";

/**
 * Haptic Feedback через Telegram.
 * Вне Telegram, на старых клиентах или при выключенной вибрации в настройках — без эффекта.
 */
function haptic() {
  if (!getSettings().hapticsEnabled) return null;
  const webApp = getTelegramWebApp();
  if (!webApp || !supportsVersion(webApp, "6.1")) return null;
  return webApp.HapticFeedback;
}

export const haptics = {
  impact(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") {
    try {
      haptic()?.impactOccurred(style);
    } catch {
      /* клиент не поддерживает */
    }
  },
  selection() {
    try {
      haptic()?.selectionChanged();
    } catch {
      /* клиент не поддерживает */
    }
  },
  notify(type: "error" | "success" | "warning") {
    try {
      haptic()?.notificationOccurred(type);
    } catch {
      /* клиент не поддерживает */
    }
  },
};
