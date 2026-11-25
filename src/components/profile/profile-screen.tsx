"use client";

import { ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ListGroup, ListRowLink } from "@/components/ui/list-row";
import { SectionTitle } from "@/components/ui/section-title";
import { PROFILE_SECTIONS } from "@/lib/navigation";
import { useTelegram } from "@/lib/telegram/telegram-provider";

export function ProfileScreen() {
  const { user, isTelegram } = useTelegram();
  const fullName = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : null;

  return (
    <>
      <Card className="mt-2 flex flex-col items-center px-5 pt-6 pb-5 text-center">
        <Avatar name={fullName} photoUrl={user?.photo_url} size={76} />
        <h1 className="mt-3 text-[24px] leading-tight font-bold tracking-tight">{fullName ?? "Мой профиль"}</h1>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          {user?.username ? `@${user.username}` : isTelegram ? "Telegram" : "Браузерный режим"}
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground">
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
