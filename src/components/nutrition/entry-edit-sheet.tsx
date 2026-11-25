"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useNutritionActions } from "@/features/nutrition/use-nutrition";
import { per100FromPortion } from "@/lib/calculations/nutrition";
import type { MealEntry } from "@/lib/db/schemas";
import { PortionForm } from "./portion-form";

export function EntryEditSheet({ entry, onClose }: { entry: MealEntry | null; onClose: () => void }) {
  const { updateEntry, deleteEntry } = useNutritionActions();
  const [busy, setBusy] = useState(false);

  return (
    <Sheet open={entry !== null} onOpenChange={(o) => !o && onClose()} title="Изменить запись">
      {entry ? (
        <PortionForm
          key={entry.id}
          name={entry.title}
          per100={per100FromPortion(entry, entry.grams)}
          isRecipe={entry.recipeId !== null}
          initialGrams={entry.grams}
          meal={entry.meal}
          submitLabel="Сохранить"
          onSubmit={async (grams, meal) => {
            if (await updateEntry(entry.id, { grams, meal })) onClose();
          }}
          extraActions={
            <Button
              size="lg"
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const ok = await deleteEntry(entry.id);
                setBusy(false);
                if (ok) onClose();
              }}
            >
              <Trash2 />
              Удалить запись
            </Button>
          }
        />
      ) : null}
    </Sheet>
  );
}
