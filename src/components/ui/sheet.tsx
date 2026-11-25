"use client";

import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Нижняя панель (bottom sheet) на базе доступного Radix Dialog. */
export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "sheet-content fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-[520px] flex-col rounded-t-[28px] bg-elevated outline-none",
            className,
          )}
          style={{ paddingBottom: "calc(var(--sab) + 16px)" }}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-muted" aria-hidden />
          <div className="flex items-start gap-3 px-5 pt-3 pb-1">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-[19px] font-bold tracking-tight">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-[14px] leading-snug text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
              aria-label="Закрыть"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 pt-3">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
