import type { Metadata } from "next";
import { ActiveWorkoutScreen } from "@/components/workouts/active-workout-screen";

export const metadata: Metadata = { title: "Тренировка · DAYONE" };

export default function Page() {
  return <ActiveWorkoutScreen />;
}
