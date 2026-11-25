"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTelegram } from "@/lib/telegram/telegram-provider";
import { haptics } from "@/lib/telegram/haptics";
import { supportsVersion } from "@/lib/telegram/webapp";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Путь родительского экрана. Внутри Telegram используется нативная кнопка «Назад». */
  backHref?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, backHref, action }: PageHeaderProps) {
  const { webApp } = useTelegram();
  const nativeBack = supportsVersion(webApp, "6.1");

  return (
    <header className="mb-5 pt-2">
      {backHref && !nativeBack ? (
        <Link
          href={backHref}
          onClick={() => haptics.selection()}
          className="-ml-1.5 mb-2 inline-flex items-center gap-0.5 rounded-xl py-1 pr-2 text-[15px] font-medium text-muted-foreground transition-colors active:text-foreground"
        >
          <ChevronLeft className="size-5" />
          Назад
        </Link>
      ) : null}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[30px] leading-tight font-bold tracking-[-0.02em] [overflow-wrap:anywhere]">{title}</h1>
          {subtitle ? <div className="mt-1 text-[15px] text-muted-foreground">{subtitle}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
