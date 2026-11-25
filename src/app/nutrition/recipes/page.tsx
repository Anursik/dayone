import type { Metadata } from "next";
import { RecipesScreen } from "@/components/nutrition/recipes-screen";

export const metadata: Metadata = { title: "Мои блюда · DAYONE" };

export default function Page() {
  return <RecipesScreen />;
}
