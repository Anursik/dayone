"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { dismissToast, useToasts } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
const COLORS = { success: "text-health", error: "text-destructive", info: "text-workouts" };

export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4"
      style={{ paddingTop: "calc(var(--sat) + 10px)" }}
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <motion.button
              key={t.id}
              type="button"
              layout
              role={t.kind === "error" ? "alert" : "status"}
              onClick={() => dismissToast(t.id)}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 500, damping: 36 }}
              className="pointer-events-auto flex w-full max-w-[440px] items-start gap-2.5 rounded-2xl border border-border bg-elevated px-4 py-3 text-left text-[14px] font-medium shadow-nav"
            >
              <Icon className={cn("mt-px size-[18px] shrink-0", COLORS[t.kind])} />
              <span className="leading-snug">{t.message}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
