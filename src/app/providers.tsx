"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { TelegramProvider } from "@/lib/telegram/telegram-provider";
import { ThemeProvider } from "@/lib/theme/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TelegramProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </TelegramProvider>
    </MotionConfig>
  );
}
