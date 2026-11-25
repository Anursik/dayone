"use client";

import { DatabaseZap } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { readLaunchUserId } from "@/lib/telegram/launch-params";
import { useTelegram } from "@/lib/telegram/telegram-provider";
import { getDatabaseName, openDatabase, requestPersistentStorage } from "./database";
import { toDataError } from "./errors";

type DatabaseState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; name: string; telegramUserId: number | null; persisted: boolean | null };

const DatabaseContext = createContext<DatabaseState>({ status: "loading" });

export function useDatabaseInfo() {
  return useContext(DatabaseContext);
}

/**
 * Открывает локальную базу текущего пользователя и показывает содержимое экрана только после этого.
 * Нижняя навигация при этом остаётся доступной.
 */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const telegram = useTelegram();
  const [state, setState] = useState<DatabaseState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!telegram.initialized) return;
    let cancelled = false;

    (async () => {
      try {
        const userId = telegram.user?.id ?? readLaunchUserId();
        const name = getDatabaseName(userId);
        await openDatabase(name);
        await profileRepository.ensure(telegram.user?.first_name ?? null);
        const persisted = await requestPersistentStorage();
        if (!cancelled) setState({ status: "ready", name, telegramUserId: userId, persisted });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: toDataError(error).userMessage });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [telegram.initialized, telegram.user, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((a) => a + 1);
  }, []);

  if (state.status === "loading") {
    return <div className="min-h-[60dvh]" aria-busy="true" aria-label="Загрузка данных" />;
  }

  if (state.status === "error") {
    return (
      <EmptyState
        className="pt-20"
        icon={DatabaseZap}
        color="var(--destructive)"
        title="Не удалось открыть данные"
        description={state.message}
      >
        <button
          type="button"
          onClick={retry}
          className="inline-flex h-11 items-center rounded-2xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground"
        >
          Повторить
        </button>
      </EmptyState>
    );
  }

  return <DatabaseContext.Provider value={state}>{children}</DatabaseContext.Provider>;
}
