"use client";

import { ChefHat, ChevronRight, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getBuiltinCatalog, type Catalog, type CatalogItem } from "@/features/nutrition/use-nutrition";
import { formatNumber } from "@/lib/format";
import type { FoodCategory } from "@/lib/nutrition/food-database";
import { haptics } from "@/lib/telegram/haptics";
import { MacroLine } from "./macro-line";

interface FoodPickerProps {
  catalog: Catalog;
  /** Показывать собственные блюда (в составе блюда выбираются только продукты) */
  includeRecipes: boolean;
  onPick: (item: CatalogItem) => void;
  onCreateFood: (name: string) => void;
}

function Row({ item, onPick }: { item: CatalogItem; onPick: (i: CatalogItem) => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptics.selection();
        onPick(item);
      }}
      className="flex w-full items-center gap-3 py-2.5 text-left active:opacity-60"
    >
      {item.kind === "recipe" ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-nutrition/15 text-nutrition">
          <ChefHat className="size-4" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{item.name}</span>
        <MacroLine macros={item.per100} />
      </span>
      <span className="tabular shrink-0 text-right text-[14px] font-semibold">
        {formatNumber(item.per100.kcal)}
        <span className="block text-[11px] font-medium text-muted-foreground">ккал/100 г</span>
      </span>
    </button>
  );
}

function Group({ title, items, onPick }: { title: string; items: CatalogItem[]; onPick: (i: CatalogItem) => void }) {
  if (!items.length) return null;
  return (
    <section className="mb-3">
      <h3 className="pt-2 text-[12px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <Row key={`${item.kind}:${item.id}`} item={item} onPick={onPick} />
        ))}
      </div>
    </section>
  );
}

export function FoodPicker({ catalog, includeRecipes, onPick, onCreateFood }: FoodPickerProps) {
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<FoodCategory | null>(null);
  const q = query.trim();

  const results = useMemo(() => (q ? catalog.search(q) : null), [catalog, q]);
  const byCategory = useMemo(() => {
    const map = new Map<FoodCategory, CatalogItem[]>();
    for (const item of getBuiltinCatalog()) {
      if (item.kind !== "food" || !item.category) continue;
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, []);

  const recent = includeRecipes ? catalog.recent : catalog.recent.filter((i) => i.kind === "food");
  const found = results
    ? (includeRecipes ? results.recipes.length : 0) + results.custom.length + results.builtin.length
    : 0;

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 bg-elevated px-5 pb-2">
        <div className="flex h-12 items-center gap-2 rounded-2xl bg-muted px-3.5 focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-[18px] shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск продукта или блюда"
            aria-label="Поиск продукта"
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-subtle-foreground [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button type="button" aria-label="Очистить поиск" onClick={() => setQuery("")} className="text-muted-foreground">
              <X className="size-[18px]" />
            </button>
          ) : null}
        </div>
      </div>

      {results ? (
        <>
          {includeRecipes ? <Group title="Мои блюда" items={results.recipes} onPick={onPick} /> : null}
          <Group title="Мои продукты" items={results.custom} onPick={onPick} />
          <Group title="База продуктов" items={results.builtin} onPick={onPick} />
          {found === 0 ? <p className="py-4 text-center text-[14px] text-muted-foreground">Ничего не найдено</p> : null}
        </>
      ) : (
        <>
          <Group title="Недавние" items={recent} onPick={onPick} />
          {includeRecipes ? <Group title="Мои блюда" items={catalog.recipeItems} onPick={onPick} /> : null}
          <Group title="Мои продукты" items={catalog.customItems} onPick={onPick} />
          <section className="mb-3">
            <h3 className="pt-2 pb-1 text-[12px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">База продуктов</h3>
            {byCategory.map(([category, items]) => (
              <div key={category} className="border-b border-border last:border-0">
                <button
                  type="button"
                  aria-expanded={openCategory === category}
                  onClick={() => {
                    haptics.selection();
                    setOpenCategory(openCategory === category ? null : category);
                  }}
                  className="flex w-full items-center justify-between py-3 text-left text-[15px] font-medium"
                >
                  {category}
                  <span className="flex items-center gap-1 text-[13px] text-muted-foreground">
                    {items.length}
                    <ChevronRight className={`size-4 transition-transform ${openCategory === category ? "rotate-90" : ""}`} />
                  </span>
                </button>
                {openCategory === category ? (
                  <div className="divide-y divide-border pb-2">
                    {items.map((item) => (
                      <Row key={item.id} item={item} onPick={onPick} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </section>
        </>
      )}

      <button
        type="button"
        onClick={() => onCreateFood(q)}
        className="mt-1 mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-[14.5px] font-semibold text-muted-foreground active:bg-muted"
      >
        <Plus className="size-[18px]" />
        {q ? `Создать продукт «${q}»` : "Создать свой продукт"}
      </button>
      <p className="pb-2 text-center text-[12px] text-subtle-foreground">Значения базы — ориентировочные средние на 100 г.</p>
    </div>
  );
}
