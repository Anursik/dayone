import type { Metadata } from "next";
import { Suspense } from "react";
import { ProgramEditorScreen } from "@/components/workouts/program-editor-screen";

export const metadata: Metadata = { title: "Программа · DAYONE" };

// ID передаётся в ?id=… — так страница остаётся статической
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
      <ProgramEditorScreen />
    </Suspense>
  );
}
