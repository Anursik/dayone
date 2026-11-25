import type { Metadata } from "next";
import { AnalyticsScreen } from "@/components/analytics/analytics-screen";

export const metadata: Metadata = { title: "Статистика · DAYONE" };

export default function Page() {
  return <AnalyticsScreen />;
}
