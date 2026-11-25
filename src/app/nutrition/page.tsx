import type { Metadata } from "next";
import { NutritionScreen } from "@/components/nutrition/nutrition-screen";

export const metadata: Metadata = { title: "Питание · DAYONE" };

export default function Page() {
  return <NutritionScreen />;
}
