import type { Metadata } from "next";
import { SettingsScreen } from "@/components/settings/settings-screen";

export const metadata: Metadata = { title: "Настройки · DAYONE" };

export default function Page() {
  return <SettingsScreen />;
}
