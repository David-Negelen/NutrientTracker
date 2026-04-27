import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/common/Card";
import { useNutrientStore } from "@/store/useNutrientStore";
import { FoodItem } from "@/types/nutrition";

type SortKey = "name" | "calories" | "protein";
type FilterTab = "all" | "foods" | "meals";

const tabs: Array<{ id: FilterTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "foods", label: "Single Foods" },
  { id: "meals", label: "Composed Meals" }
];

function FoodRow({ food, onDelete }: { food: FoodItem; onDelete: () => void }) {
  const isMeal = Boolean(food.mealComposition && food.mealComposition.length > 0);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={[
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
              isMeal
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            ].join(" ")}
          >
            {isMeal ? "Meal" : "Food"}
          </span>
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{food.name}</p>
          {food.brand ? <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{food.brand}</span> : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{Math.round(food.nutrients.calories)} kcal</span>
          <span>P {food.nutrients.protein.toFixed(1)}g</span>
          <span>C {food.nutrients.carbs.toFixed(1)}g</span>
          <span>F {food.nutrients.fat.toFixed(1)}g</span>
          <span className="text-slate-400 dark:text-slate-500">
            {food.servingSize}{food.servingUnit} per serving
          </span>
          {isMeal ? (
            <span className="text-slate-400 dark:text-slate-500">{food.mealComposition!.length} ingredients</span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isMeal ? (
          <Link
            to="/add"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Edit
          </Link>
        ) : null}
        {confirming ? (
          <>
            <button
              onClick={onDelete}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export function FoodsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const foods = useNutrientStore((state) => state.foods);
  const deleteFood = useNutrientStore((state) => state.deleteFood);

  const customFoods = foods.filter(
    (f) => f.source === "custom" && (!f.mealComposition || f.mealComposition.length === 0)
  );
  const customMeals = foods.filter(
    (f) => f.source === "custom" && f.mealComposition && f.mealComposition.length > 0
  );
  const externalFoods = foods.filter((f) => f.source !== "custom");

  const pool: FoodItem[] =
    filter === "foods"
      ? customFoods
      : filter === "meals"
        ? customMeals
        : [...customFoods, ...customMeals, ...externalFoods];

  const filtered = search.trim()
    ? pool.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.brand?.toLowerCase().includes(search.toLowerCase())
      )
    : pool;

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "calories") return b.nutrients.calories - a.nutrients.calories;
    return b.nutrients.protein - a.nutrients.protein;
  });

  const tabCounts: Record<FilterTab, number> = {
    all: customFoods.length + customMeals.length + externalFoods.length,
    foods: customFoods.length,
    meals: customMeals.length
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Food Library</h2>
        <Link
          to="/add"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Add Food
        </Link>
      </div>

      <Card title={`${sorted.length} item${sorted.length === 1 ? "" : "s"}`}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search foods…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <div className="flex rounded-full bg-slate-100 p-1 dark:bg-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  filter === tab.id
                    ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                ].join(" ")}
              >
                {tab.label}
                {tabCounts[tab.id] > 0 ? (
                  <span className="ml-1 opacity-60">({tabCounts[tab.id]})</span>
                ) : null}
              </button>
            ))}
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-xl border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="name">Sort: Name</option>
            <option value="calories">Sort: Calories</option>
            <option value="protein">Sort: Protein</option>
          </select>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {search ? `No foods matching "${search}".` : "No foods in your library yet."}
            </p>
            <Link
              to="/add"
              className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Add your first food →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((food) => (
              <FoodRow key={food.id} food={food} onDelete={() => deleteFood(food.id)} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
