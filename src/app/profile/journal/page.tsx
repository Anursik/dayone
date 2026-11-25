import type { Metadata } from "next";
import { JournalScreen } from "@/components/journal/journal-screen";

export const metadata: Metadata = { title: "Дневник · DAYONE" };

export default function Page() {
  return <JournalScreen />;
}
