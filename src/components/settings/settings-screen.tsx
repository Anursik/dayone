"use client";

import { Clock, Globe, Info, Palette, Smartphone, UserRound, Vibrate } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ListGroup, ListRow, ListRowLink } from "@/components/ui/list-row";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { getLocalTimeZone } from "@/lib/date";
import type { ThemeMode } from "@/lib/settings/settings-store";
import { useSettings } from "@/lib/settings/use-settings";
import { useTelegram } from "@/lib/telegram/telegram-provider";
import { useTheme } from "@/lib/theme/theme-provider";
import { DataSection } from "./data-section";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "Авто" },
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
];

function Value({ children }: { children: React.ReactNode }) {
  return <span className="max-w-[45%] truncate text-right text-[14px] text-muted-foreground">{children}</span>;
}

export function SettingsScreen() {
  const { mode, resolved, setMode } = useTheme();
  const [settings, updateSettings] = useSettings();
  const telegram = useTelegram();
  const [timeZone, setTimeZone] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setTimeZone(getLocalTimeZone()), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <PageHeader title="Настройки" backHref="/profile" />

      <SectionTitle className="mt-0">Оформление</SectionTitle>
      <Card>
        <div className="mb-3 flex items-center gap-2.5">
          <Palette className="size-[18px] text-muted-foreground" />
          <span className="text-[15px] font-medium">Тема</span>
          <span className="ml-auto text-[13px] text-muted-foreground">
            {mode === "system"
              ? `${telegram.isTelegram ? "как в Telegram" : "как в системе"} · ${resolved === "dark" ? "тёмная" : "светлая"}`
              : null}
          </span>
        </div>
        <SegmentedControl ariaLabel="Тема оформления" value={mode} options={THEME_OPTIONS} onChange={setMode} />
      </Card>

      <SectionTitle>Общие</SectionTitle>
      <ListGroup>
        <ListRowLink
          href="/profile/edit"
          icon={UserRound}
          color="var(--c-habits)"
          title="Профиль и цели"
          subtitle="Имя, возраст, рост, вес, нормы"
        />
        <ListRow
          icon={Vibrate}
          title="Вибрация"
          subtitle={telegram.isTelegram ? "Тактильный отклик Telegram" : "Работает только внутри Telegram"}
          trailing={
            <Switch
              label="Вибрация"
              checked={settings.hapticsEnabled}
              onCheckedChange={(checked) => updateSettings({ hapticsEnabled: checked })}
            />
          }
        />
        <ListRow icon={Globe} title="Язык" trailing={<Value>Русский</Value>} />
        <ListRow icon={Clock} title="Часовой пояс" subtitle="Определяется устройством" trailing={<Value>{timeZone}</Value>} />
      </ListGroup>

      <SectionTitle>О приложении</SectionTitle>
      <ListGroup>
        <ListRow
          icon={Smartphone}
          title="Окружение"
          trailing={<Value>{telegram.initialized ? (telegram.isTelegram ? "Telegram" : "Браузер") : "…"}</Value>}
        />
        {telegram.isTelegram ? (
          <ListRow
            icon={Info}
            title="Telegram"
            trailing={<Value>{`${telegram.platform} · Bot API ${telegram.version}`}</Value>}
          />
        ) : null}
        <ListRow icon={Info} title="Версия DAYONE" trailing={<Value>{process.env.NEXT_PUBLIC_APP_VERSION}</Value>} />
      </ListGroup>

      <DataSection />
    </>
  );
}
