import type { Metadata } from "next";
import { HealthScreen } from "@/components/health/health-screen";

export const metadata: Metadata = { title: "Здоровье · DAYONE" };

export default function Page() {
  return <HealthScreen />;
}
