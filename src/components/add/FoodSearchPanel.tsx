import { useState } from "react";
import { FoodItem } from "@/types/nutrition";
import { useFoodSearch } from "@/hooks/useFoodQueries";
import { NutritionDetails } from "@/components/common/NutritionDetails";

interface FoodSearchPanelProps {
  onSelectFood: (food: FoodItem) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (foodId: string) => void;
}

export function FoodSearchPanel({ onSelectFood, favoriteIds = [], onToggleFavorite }: FoodSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isFetching } = useFoodSearch(query);

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for foods (e.g., yogurt, cheese, rice)..."
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
      />

      {isFetching ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Searching…</p>
      ) : null}

      <ul className="space-y-2">
        {(data ?? []).map((result) => {
          const isFavorite = favoriteIds.includes(result.item.id);
          const isExpanded = expandedId === result.item.id;
          return (
            <li
              key={result.id}
              className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : result.item.id)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{result.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{result.subtitle || "USDA"}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {Math.round(result.item.nutrients.calories)} kcal
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(result.item.id);
                        }}
                        className={[
                          "rounded-lg px-3 py-2 text-sm font-semibold",
                          isFavorite
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:hover:bg-yellow-900/60"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                        ].join(" ")}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        {isFavorite ? "★" : "☆"}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFood(result.item);
                      }}
                      className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <NutritionDetails
                    nutrients={result.item.nutrients}
                    servingSize={result.item.servingSize}
                    servingUnit={result.item.servingUnit}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {query.trim().length >= 2 && !isFetching && (data ?? []).length === 0 ? (
        <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          No foods found. Try another search term.
        </p>
      ) : null}

      {!import.meta.env.VITE_USDA_API_KEY ? (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Missing USDA API key. Please add VITE_USDA_API_KEY to your .env file.
        </p>
      ) : null}
    </div>
  );
}
