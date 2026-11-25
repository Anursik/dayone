import type { Metadata } from "next";
import { Suspense } from "react";
import { MetricScreen } from "@/components/health/metric-screen";

export const metadata: Metadata = { title: "Показатель · DAYONE" };

// Тип показателя и день передаются в ?type=…&day=… — страница остаётся статической
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
      <MetricScreen />
    </Suspense>
  );
}
