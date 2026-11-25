import type { Metadata } from "next";
import { FoodsScreen } from "@/components/nutrition/foods-screen";

export const metadata: Metadata = { title: "Мои продукты · DAYONE" };

export default function Page() {
  return <FoodsScreen />;
}
