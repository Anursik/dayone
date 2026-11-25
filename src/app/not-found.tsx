import { Compass } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      className="pt-24"
      icon={Compass}
      color="var(--c-workouts)"
      title="Экран не найден"
      description="Такой страницы в DAYONE нет."
    >
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-2xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground"
      >
        На главную
      </Link>
    </EmptyState>
  );
}
