import type { Metadata } from "next";
import { Suspense } from "react";
import { HabitDetailScreen } from "@/components/habits/habit-detail-screen";

export const metadata: Metadata = { title: "Привычка · DAYONE" };

// ID привычки передаётся в ?id=… — это позволяет обойтись статическим экспортом
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
      <HabitDetailScreen />
    </Suspense>
  );
}
