"use client";

import { TriangleAlert } from "lucide-react";
import { Component, type ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { toDataError } from "@/lib/db/errors";

interface State {
  error: unknown;
}

/** Ловит ошибки отрисовки экрана (в том числе ошибки чтения данных) и показывает понятное сообщение. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <EmptyState
        className="pt-20"
        icon={TriangleAlert}
        color="var(--destructive)"
        title="Что-то пошло не так"
        description={toDataError(this.state.error).userMessage}
      >
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-11 items-center rounded-2xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground"
        >
          Перезапустить
        </button>
      </EmptyState>
    );
  }
}
