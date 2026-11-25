import type { Metadata } from "next";
import { ExercisesScreen } from "@/components/workouts/exercises-screen";

export const metadata: Metadata = { title: "Упражнения · DAYONE" };

export default function Page() {
  return <ExercisesScreen />;
}
