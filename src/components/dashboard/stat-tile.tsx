"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { haptics } from "@/lib/telegram/haptics";

interface StatTileProps {
  href: string;
  icon: LucideIcon;
  color: string;
  label: string;
  value: string;
  hint: string;
  /** 0..1; null — цель не задана (пустая шкала); undefined — без шкалы */
  progress?: number | null;
}

export function StatTile({ href, icon, color, label, value, hint, progress }: StatTileProps) {
  return (
    <Link href={href} onClick={() => haptics.selection()} className="block h-full transition-transform active:scale-[0.98]">
      <Card className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2">
          <IconBadge icon={icon} color={color} size="sm" />
          <span className="truncate text-[12.5px] font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="tabular mt-3 truncate text-[22px] leading-tight font-bold tracking-tight">{value}</p>
        <p className="mt-0.5 mb-3 truncate text-[12.5px] text-muted-foreground">{hint}</p>
        {progress !== undefined ? (
          <ProgressBar className="mt-auto" value={progress ?? 0} color={color} label={label} />
        ) : null}
      </Card>
    </Link>
  );
}
