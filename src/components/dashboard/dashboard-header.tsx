"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useNow } from "@/hooks/use-now";
import { formatLongDate, getGreeting } from "@/lib/date";
import { haptics } from "@/lib/telegram/haptics";
import { useTelegram } from "@/lib/telegram/telegram-provider";

export function DashboardHeader({ profileName }: { profileName: string | null }) {
  const now = useNow();
  const { user } = useTelegram();
  // Имя из локального профиля; имя из Telegram — только запасной вариант
  const name = profileName || user?.first_name || null;
  const firstName = name?.split(/\s+/)[0] ?? null;

  return (
    <header className="flex items-center justify-between gap-3 pt-2 pb-5">
      <div className="min-w-0">
        <p className="h-5 text-[14px] font-medium text-muted-foreground">{now ? formatLongDate(now) : ""}</p>
        <h1 className="mt-0.5 truncate text-[28px] leading-tight font-bold tracking-[-0.02em]">
          {now ? getGreeting(now) : "Привет"}
          {firstName ? `, ${firstName}` : ""}
        </h1>
      </div>
      <Link href="/profile" aria-label="Профиль" onClick={() => haptics.selection()} className="transition-transform active:scale-95">
        <Avatar name={name} photoUrl={user?.photo_url} />
      </Link>
    </header>
  );
}
