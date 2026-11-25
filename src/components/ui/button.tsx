"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[transform,background-color,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-muted text-foreground",
        ghost: "text-foreground hover:bg-muted",
        destructive: "bg-destructive/10 text-destructive",
      },
      size: {
        sm: "h-9 rounded-xl px-3.5 text-[13px]",
        md: "h-11 rounded-2xl px-5 text-[15px]",
        lg: "h-14 w-full rounded-[18px] px-6 text-[16px]",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Тактильный отклик Telegram при нажатии */
  haptic?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, haptic = true, onClick, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={(event) => {
        if (haptic) haptics.impact("light");
        onClick?.(event);
      }}
      {...props}
    />
  );
});
