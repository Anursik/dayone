"use client";

import { useEffect, useId, useRef, type TextareaHTMLAttributes } from "react";

interface AutoTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  value: string;
}

/** Многострочное поле, растущее по мере ввода текста. */
export function AutoTextarea({ label, value, className, ...props }: AutoTextareaProps) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block px-1 text-[14px] font-semibold">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        rows={2}
        className="min-h-[76px] w-full resize-none overflow-hidden rounded-2xl bg-muted px-4 py-3 text-[16px] leading-relaxed outline-none placeholder:text-subtle-foreground focus:ring-2 focus:ring-ring"
        {...props}
      />
    </div>
  );
}
