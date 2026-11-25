import type { Metadata } from "next";
import { WorkoutsScreen } from "@/components/workouts/workouts-screen";

export const metadata: Metadata = { title: "Тренировки · DAYONE" };

export default function Page() {
  return <WorkoutsScreen />;
}
