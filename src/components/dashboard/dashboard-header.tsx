"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useNow } from "@/hooks/use-now";
import { formatLongDate, getGreeting } from "@/lib/date";
import { haptics } from "@/lib/telegram/haptics";
import { useTelegram } from "@/lib/telegram/telegram-provider";

export function DashboardHeader() {
  const now = useNow();
  const { user } = useTelegram();
  const name = user?.first_name ?? null;

  return (
    <header className="flex items-center justify-between gap-3 pt-2 pb-5">
      <div className="min-w-0">
        <p className="h-5 text-[14px] font-medium text-muted-foreground">{now ? formatLongDate(now) : ""}</p>
        <h1 className="mt-0.5 truncate text-[28px] leading-tight font-bold tracking-[-0.02em]">
          {now ? getGreeting(now) : "Привет"}
          {name ? `, ${name}` : ""}
        </h1>
      </div>
      <Link href="/profile" aria-label="Профиль" onClick={() => haptics.selection()} className="active:scale-95 transition-transform">
        <Avatar name={user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : null} photoUrl={user?.photo_url} />
      </Link>
    </header>
  );
}
