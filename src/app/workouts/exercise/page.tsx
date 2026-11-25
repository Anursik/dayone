import type { Metadata } from "next";
import { Suspense } from "react";
import { ExerciseDetailScreen } from "@/components/workouts/exercise-detail-screen";

export const metadata: Metadata = { title: "Упражнение · DAYONE" };

// ID передаётся в ?id=… — так страница остаётся статической
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
      <ExerciseDetailScreen />
    </Suspense>
  );
}
