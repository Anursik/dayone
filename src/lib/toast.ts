import { useSyncExternalStore } from "react";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function toast(message: string, kind: ToastKind = "info", durationMs = kind === "error" ? 5000 : 2800) {
  const id = nextId++;
  items = [...items.slice(-2), { id, kind, message }];
  emit();
  window.setTimeout(() => dismissToast(id), durationMs);
}

const EMPTY: ToastItem[] = [];

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
    () => EMPTY,
  );
}
