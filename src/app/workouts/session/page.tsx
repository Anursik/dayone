import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionDetailScreen } from "@/components/workouts/session-detail-screen";

export const metadata: Metadata = { title: "Тренировка · DAYONE" };

// ID передаётся в ?id=… — так страница остаётся статической
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
      <SessionDetailScreen />
    </Suspense>
  );
}
