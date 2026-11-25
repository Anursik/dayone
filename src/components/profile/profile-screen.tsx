"use client";

import { Pencil, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ListGroup, ListRowLink } from "@/components/ui/list-row";
import { SectionTitle } from "@/components/ui/section-title";
import { useProfile } from "@/features/profile/use-profile";
import { PROFILE_SECTIONS } from "@/lib/navigation";
import { haptics } from "@/lib/telegram/haptics";
import { useTelegram } from "@/lib/telegram/telegram-provider";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-muted px-2 py-2.5">
      <p className="tabular text-[16px] font-bold">{value}</p>
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

const fmt = (v: number | null, unit: string) => (v === null ? "—" : `${String(v).replace(".", ",")} ${unit}`);

export function ProfileScreen() {
  const { user, isTelegram } = useTelegram();
  const profile = useProfile();
  const telegramName = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : null;
  const name = profile?.name || telegramName;

  return (
    <>
      <Card className="mt-2 flex flex-col items-center px-5 pt-6 pb-5 text-center">
        <Avatar name={name} photoUrl={user?.photo_url} size={76} />
        <h1 className="mt-3 text-[24px] leading-tight font-bold tracking-tight">{name || "Мой профиль"}</h1>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          {user?.username ? `@${user.username}` : isTelegram ? "Telegram" : "Браузерный режим"}
        </p>

        <div className="mt-4 flex w-full gap-2">
          <Stat label="Возраст" value={fmt(profile?.age ?? null, "лет")} />
          <Stat label="Рост" value={fmt(profile?.heightCm ?? null, "см")} />
          <Stat label="Вес" value={fmt(profile?.weightKg ?? null, "кг")} />
        </div>

        <Link
          href="/profile/edit"
          onClick={() => haptics.selection()}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Pencil className="size-4" />
          Профиль и цели
        </Link>

        <div className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground">
          <ShieldCheck className="size-4 text-health" />
          Данные хранятся только на этом устройстве
        </div>
      </Card>

      <SectionTitle>Разделы</SectionTitle>
      <ListGroup>
        {PROFILE_SECTIONS.map((section) => (
          <ListRowLink
            key={section.href}
            href={section.href}
            icon={section.icon}
            color={section.color}
            title={section.label}
            subtitle={section.description}
          />
        ))}
      </ListGroup>
    </>
  );
}
