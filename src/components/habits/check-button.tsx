"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckButtonProps {
  checked: boolean;
  color: string;
  label: string;
  disabled?: boolean;
  onToggle: () => void;
  size?: number;
}

/** Круглая кнопка отметки выполнения с анимацией. */
export function CheckButton({ checked, color, label, disabled, onToggle, size = 44 }: CheckButtonProps) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      whileTap={{ scale: 0.86 }}
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 disabled:opacity-40",
        checked ? "border-transparent" : "border-border bg-transparent",
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: checked ? color : undefined,
        borderColor: checked ? undefined : `color-mix(in srgb, ${color} 35%, transparent)`,
      }}
    >
      <AnimatePresence initial={false}>
        {checked ? (
          <motion.span
            key="check"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 26 }}
            className="text-white"
          >
            <Check className="size-[22px]" strokeWidth={3} />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}
