"use client";

import { useSyncExternalStore } from "react";
import { getServerSettings, getSettings, subscribeSettings, updateSettings } from "./settings-store";

export function useSettings() {
  const settings = useSyncExternalStore(subscribeSettings, getSettings, getServerSettings);
  return [settings, updateSettings] as const;
}
