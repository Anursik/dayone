"use client";

import Link from "next/link";
import { CalorieOverview } from "@/components/nutrition/calorie-overview";
import { haptics } from "@/lib/telegram/haptics";
import type { DashboardSummary } from "@/types/dashboard";

export function NutritionSummaryCard({ nutrition }: { nutrition: DashboardSummary["nutrition"] }) {
  return (
    <Link href="/nutrition" onClick={() => haptics.selection()} className="block transition-transform active:scale-[0.99]">
      <CalorieOverview nutrition={nutrition} />
    </Link>
  );
}
