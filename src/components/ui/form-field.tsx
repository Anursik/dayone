"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  suffix?: ReactNode;
  hint?: string;
  error?: string | null;
}

/** Поле ввода с подписью, единицей измерения и сообщением об ошибке. */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, suffix, hint, error, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block px-1 text-[13px] font-medium text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          "flex h-12 items-center rounded-2xl bg-muted px-4 transition-shadow focus-within:ring-2",
          error ? "ring-2 ring-destructive/60 focus-within:ring-destructive/60" : "focus-within:ring-ring",
        )}
      >
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className="tabular h-full min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:text-subtle-foreground"
          {...props}
        />
        {suffix ? <span className="ml-2 shrink-0 text-[14px] text-muted-foreground">{suffix}</span> : null}
      </div>
      {error || hint ? (
        <p id={messageId} className={cn("mt-1 px-1 text-[12.5px]", error ? "text-destructive" : "text-muted-foreground")}>
          {error || hint}
        </p>
      ) : null}
    </div>
  );
});
