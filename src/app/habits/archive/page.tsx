import type { Metadata } from "next";
import { HabitArchiveScreen } from "@/components/habits/habit-archive-screen";

export const metadata: Metadata = { title: "Архив привычек · DAYONE" };

export default function Page() {
  return <HabitArchiveScreen />;
}
