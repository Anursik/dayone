"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import { getParentPath } from "@/lib/navigation";
import { useTelegramBackButton } from "@/lib/telegram/use-back-button";
import { BottomNav } from "./bottom-nav";

/** Каркас приложения: контент с учётом safe area, нижняя навигация и кнопка «Назад» Telegram. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const parent = getParentPath(pathname);

  const goBack = useCallback(() => {
    if (parent) router.push(parent);
  }, [parent, router]);

  useTelegramBackButton(Boolean(parent), goBack);

  return (
    <div className="mx-auto min-h-[var(--app-height)] w-full max-w-[520px]">
      <main
        className="px-4"
        style={{
          paddingTop: "calc(var(--sat) + 12px)",
          paddingBottom: "calc(var(--nav-height) + var(--sab) + 32px)",
          paddingLeft: "max(16px, var(--sal))",
          paddingRight: "max(16px, var(--sar))",
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
