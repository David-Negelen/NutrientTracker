import { FormEvent, useMemo, useState } from "react";
import { searchOpenFoodFactsFoods } from "@/api/openFoodFacts";
import { searchUsdaFoods } from "@/api/usda";
import { NutritionDetails } from "@/components/common/NutritionDetails";
import { estimateLactoseG } from "@/utils/dairy";
import { FoodItem, NutrientValues, emptyNutrients, scaleNutrients } from "@/types/nutrition";

interface ParsedIngredient {
  query: string;
  grams: number;
}

interface ReviewItem {
  id: string;
  query: string;
  grams: number;
  food: FoodItem | null;
}

function toGrams(amount: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case "kg": return Math.round(amount * 1000);
    case "oz": return Math.round(amount * 28.35);
    case "cup": case "cups": return Math.round(amount * 240);
    case "tbsp": case "tablespoon": case "tablespoons": return Math.round(amount * 15);
    case "tsp": case "teaspoon": case "teaspoons": return Math.round(amount * 5);
    default: return Math.round(amount);
  }
}

function parseDescription(text: string): ParsedIngredient[] {
  const parts = text
    .split(/,|\band\b|\bwith\b|\bplus\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  return parts.map((part) => {
    const leadMatch = part.match(
      /^(\d+(?:\.\d+)?)\s*(g|gram|grams|kg|ml|oz|cup|cups|tbsp|tsp|tablespoons?|teaspoons?)?\s+(.+)$/i
    );
    if (leadMatch) {
      return { query: leadMatch[3].trim(), grams: toGrams(parseFloat(leadMatch[1]), leadMatch[2] || "g") };
    }

    const trailMatch = part.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(g|gram|grams|kg|ml|oz)?$/i);
    if (trailMatch) {
      return { query: trailMatch[1].trim(), grams: toGrams(parseFloat(trailMatch[2]), trailMatch[3] || "g") };
    }

    return { query: part, grams: 100 };
  });
}

async function findBestMatch(query: string): Promise<FoodItem | null> {
  const [off, usda] = await Promise.allSettled([
    searchOpenFoodFactsFoods(query),
    searchUsdaFoods(query),
  ]);
  const results = [
    ...(off.status === "fulfilled" ? off.value : []),
    ...(usda.status === "fulfilled" ? usda.value : []),
  ];
  return results[0]?.item ?? null;
}

const requiredKeys: Array<keyof Omit<NutrientValues, "addedSugar">> = [
  "calories", "protein", "carbs", "fat", "fiber", "sugar",
];

interface QuickMealPanelProps {
  onSaveMeal: (meal: FoodItem) => void;
}

export function QuickMealPanel({ onSaveMeal }: QuickMealPanelProps) {
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<"input" | "loading" | "review">("input");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [mealName, setMealName] = useState("");

  const handleParse = async () => {
    const parsed = parseDescription(description.trim());
    if (parsed.length === 0) return;
    setStage("loading");
    const resolved = await Promise.all(
      parsed.map(async ({ query, grams }) => ({
        id: `qm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        query,
        grams,
        food: await findBestMatch(query),
      }))
    );
    setItems(resolved);
    setMealName("");
    setStage("review");
  };

  const updateGrams = (id: string, grams: number) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, grams: Math.max(1, grams) } : item)));

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const matchedItems = items.filter((item) => item.food !== null);

  const combinedNutrients = useMemo((): NutrientValues => {
    const combined = emptyNutrients();
    const anyHasAddedSugar = matchedItems.some(
      ({ food }) =>
        food!.nutrients.addedSugar !== undefined ||
        estimateLactoseG(food!.name, food!.brand) !== null
    );
    let totalAddedSugar = 0;

    matchedItems.forEach(({ food, grams }) => {
      const factor = grams / food!.servingSize;
      const scaled = scaleNutrients(food!.nutrients, factor);
      requiredKeys.forEach((key) => { combined[key] += scaled[key] ?? 0; });
      if (anyHasAddedSugar) {
        if (scaled.addedSugar !== undefined) {
          totalAddedSugar += scaled.addedSugar;
        } else {
          const lactose = estimateLactoseG(food!.name, food!.brand);
          if (lactose !== null) {
            const lactosePerServing = lactose * (food!.servingSize / 100);
            totalAddedSugar += Math.max(0, food!.nutrients.sugar - lactosePerServing) * factor;
          } else {
            totalAddedSugar += scaled.sugar;
          }
        }
      }
    });

    return anyHasAddedSugar ? { ...combined, addedSugar: totalAddedSugar } : combined;
  }, [matchedItems]);

  const totalGrams = matchedItems.reduce((sum, { grams }) => sum + grams, 0);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!mealName.trim() || matchedItems.length === 0) return;
    onSaveMeal({
      id: `meal-${Date.now()}`,
      name: mealName.trim(),
      servingSize: totalGrams,
      servingUnit: "g",
      source: "custom",
      nutrients: combinedNutrients,
      mealComposition: matchedItems.map(({ food, grams }) => ({ food: food!, grams })),
    });
    setDescription("");
    setItems([]);
    setMealName("");
    setStage("input");
  };

  const sectionClass = "rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800";

  if (stage === "input") {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Describe your meal
          </label>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            List ingredients with optional amounts — e.g.{" "}
            <span className="italic">"150g chicken breast, 200g rice, broccoli"</span>
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && description.trim()) {
                e.preventDefault();
                handleParse();
              }
            }}
            placeholder="150g chicken breast, 200g white rice, steamed broccoli"
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
        <button
          type="button"
          onClick={handleParse}
          disabled={!description.trim()}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Search Ingredients
        </button>
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        <span className="text-sm text-slate-600 dark:text-slate-400">Searching for ingredients…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Review Ingredients
        </h3>
        <button
          type="button"
          onClick={() => { setStage("input"); setItems([]); setMealName(""); }}
          className="text-xs text-brand-600 hover:underline dark:text-brand-400"
        >
          ← Edit description
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={[
              "rounded-lg border p-3",
              item.food
                ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {item.food ? (
                  <>
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {item.food.name}
                    </p>
                    {item.food.brand && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.food.brand}</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {Math.round(item.food.nutrients.calories * (item.grams / item.food.servingSize))} kcal
                      · P {(item.food.nutrients.protein * (item.grams / item.food.servingSize)).toFixed(1)}g
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    No match for <span className="font-medium">"{item.query}"</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="shrink-0 rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-900/60"
              >
                Remove
              </button>
            </div>
            {item.food && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Amount</span>
                <input
                  type="number"
                  min={1}
                  value={item.grams}
                  onChange={(e) => updateGrams(item.id, Number(e.target.value))}
                  className="w-20 rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">g</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {matchedItems.length > 0 ? (
        <>
          <div className={sectionClass}>
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nutrition Preview
            </h3>
            <NutritionDetails nutrients={combinedNutrients} servingSize={totalGrams} servingUnit="g" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Meal name
            </label>
            <input
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g. Chicken Rice Bowl"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={!mealName.trim()}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Save Meal
          </button>
        </>
      ) : (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
          No ingredients matched. Try editing your description.
        </p>
      )}
    </form>
  );
}
