"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SkipForward, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatClock } from "@/lib/calculations/workouts";
import { haptics } from "@/lib/telegram/haptics";
import { toast } from "@/lib/toast";

const STORAGE_KEY = "dayone:rest-timer";

interface TimerState {
  endsAt: number;
  total: number;
}

function load(): TimerState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as TimerState;
    return typeof v.endsAt === "number" && v.endsAt > Date.now() ? v : null;
  } catch {
    return null;
  }
}

function persist(state: TimerState | null) {
  try {
    if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* хранилище недоступно — таймер работает до перезапуска */
  }
}

/**
 * Таймер отдыха между подходами. Состояние хранится как момент окончания,
 * поэтому он продолжает идти, даже если Telegram свернуть или перезапустить приложение.
 */
export function useRestTimer() {
  const [state, setState] = useState<TimerState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setTimeout(() => setState(load()), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!state) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= state.endsAt) {
        setState(null);
        persist(null);
        haptics.notify("success");
        toast("Отдых окончен — следующий подход!", "info");
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state]);

  const start = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    const next = { endsAt: Date.now() + seconds * 1000, total: seconds };
    setState(next);
    persist(next);
  }, []);

  const adjust = useCallback((delta: number) => {
    setState((s) => {
      if (!s) return s;
      const endsAt = Math.max(Date.now() + 1000, s.endsAt + delta * 1000);
      const next = { endsAt, total: Math.max(s.total + delta, 1) };
      persist(next);
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    setState(null);
    persist(null);
  }, []);

  const remaining = state ? Math.max(0, Math.ceil((state.endsAt - now) / 1000)) : 0;
  return { active: state !== null, remaining, total: state?.total ?? 0, start, adjust, stop };
}

export function RestTimerBar({ timer }: { timer: ReturnType<typeof useRestTimer> }) {
  return (
    <AnimatePresence>
      {timer.active ? (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="fixed inset-x-0 z-40 mx-auto w-full max-w-[460px] px-3"
          style={{ bottom: "calc(var(--nav-height) + var(--sab) + 18px)" }}
          role="timer"
          aria-label="Отдых"
        >
          <div className="overflow-hidden rounded-[22px] bg-workouts text-white shadow-nav">
            <div className="flex items-center gap-2 px-3 py-2">
              <Timer className="size-5 shrink-0" />
              <span className="hidden text-[13px] font-semibold opacity-90 min-[400px]:inline">Отдых</span>
              <span className="tabular min-w-0 flex-1 text-[22px] font-bold">{formatClock(timer.remaining)}</span>
              <button type="button" aria-label="Минус 15 секунд" onClick={() => timer.adjust(-15)} className="h-10 shrink-0 rounded-xl bg-white/20 px-2.5 text-[13px] font-bold">
                −15
              </button>
              <button type="button" aria-label="Плюс 15 секунд" onClick={() => timer.adjust(15)} className="h-10 shrink-0 rounded-xl bg-white/20 px-2.5 text-[13px] font-bold">
                +15
              </button>
              <button type="button" aria-label="Пропустить" onClick={timer.stop} className="grid h-10 w-11 shrink-0 place-items-center rounded-xl bg-white text-workouts">
                <SkipForward className="size-5" />
              </button>
            </div>
            <div className="h-1 bg-white/25">
              <div className="h-full bg-white transition-[width] duration-300 ease-linear" style={{ width: `${(timer.remaining / Math.max(timer.total, 1)) * 100}%` }} />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
