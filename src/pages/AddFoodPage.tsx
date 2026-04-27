import { useState } from "react";
import { BarcodeScannerPanel } from "@/components/add/BarcodeScannerPanel";
import { FoodSearchPanel } from "@/components/add/FoodSearchPanel";
import { CustomFoodForm } from "@/components/add/CustomFoodForm";
import { MealCompositionForm } from "@/components/add/MealCompositionForm";
import { useBarcodeLookup } from "@/hooks/useFoodQueries";
import { useNutrientStore } from "@/store/useNutrientStore";
import { FoodItem, LogEntry, MealType, scaleNutrients } from "@/types/nutrition";

const tabs = [
  { id: "add", label: "Add" },
  { id: "create", label: "Create" }
] as const;

type QuickFilter = "recent" | "favorites" | "myfoods";

export function AddFoodPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("add");
  const [quickListFilter, setQuickListFilter] = useState<QuickFilter>("recent");
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [servingsStr, setServingsStr] = useState("1");
  const [addBanner, setAddBanner] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: scannedFood, isFetching } = useBarcodeLookup(barcode);

  const servingsNum = Math.max(0.25, parseFloat(servingsStr) || 1);

  const foods = useNutrientStore((state) => state.foods);
  const favorites = useNutrientStore((state) => state.favorites);
  const recent = useNutrientStore((state) => state.recentFoodIds);
  const addFood = useNutrientStore((state) => state.addFood);
  const updateFood = useNutrientStore((state) => state.updateFood);
  const deleteFood = useNutrientStore((state) => state.deleteFood);
  const addLogEntry = useNutrientStore((state) => state.addLogEntry);
  const toggleFavorite = useNutrientStore((state) => state.toggleFavorite);
  const touchRecent = useNutrientStore((state) => state.touchRecent);
  const clearRecent = useNutrientStore((state) => state.clearRecent);

  const addItemToLog = (food: FoodItem) => {
    addFood(food);
    const entry: LogEntry = {
      id: `log-${Date.now()}`,
      foodItemId: food.id,
      foodName: food.name,
      consumedAt: new Date(selectedDate + "T12:00:00").toISOString(),
      servings: servingsNum,
      mealType,
      nutrients: scaleNutrients(food.nutrients, servingsNum)
    };
    addLogEntry(entry);
    setAddBanner(`Added ${food.name} (${servingsNum} serving${servingsNum !== 1 ? "s" : ""}) to ${mealType}.`);
    window.setTimeout(() => setAddBanner(null), 1800);
  };

  const customMeals = foods.filter(
    (food) => food.source === "custom" && food.mealComposition && food.mealComposition.length > 0
  );
  const customFoods = foods.filter(
    (food) => food.source === "custom" && (!food.mealComposition || food.mealComposition.length === 0)
  );

  const recentFoods = recent.map((id) => foods.find((food) => food.id === id)).filter(Boolean) as FoodItem[];
  const favoriteFoods = favorites.map((id) => foods.find((food) => food.id === id)).filter(Boolean) as FoodItem[];
  const editingMeal = customMeals.find((meal) => meal.id === editingMealId) ?? null;

  const quickFoods: FoodItem[] =
    quickListFilter === "recent" ? recentFoods : quickListFilter === "favorites" ? favoriteFoods : customFoods;

  const quickFilters: Array<{ id: QuickFilter; label: string; count?: number }> = [
    { id: "recent", label: "Recent" },
    { id: "favorites", label: "Favorites" },
    { id: "myfoods", label: "My Foods", count: customFoods.length }
  ];

  const showBanner = (msg: string, ms = 1800) => {
    setAddBanner(msg);
    window.setTimeout(() => setAddBanner(null), ms);
  };

  const sectionClass =
    "rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60";
  const innerSectionClass =
    "rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60";

  let tabContent: JSX.Element;
  if (activeTab === "add") {
    tabContent = (
      <div className="space-y-3">
        <section className={sectionClass}>
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Add</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Food library */}
            <div className={innerSectionClass}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Food Library
                </h4>
                <div className="flex items-center gap-2">
                  {quickListFilter === "recent" ? (
                    <button
                      onClick={() => clearRecent()}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Clear
                    </button>
                  ) : null}
                  <div className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600">
                    {quickFilters.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setQuickListFilter(f.id)}
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold transition",
                          quickListFilter === f.id
                            ? f.id === "favorites"
                              ? "bg-rose-500 text-white"
                              : f.id === "myfoods"
                                ? "bg-emerald-600 text-white"
                                : "bg-brand-600 text-white"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-600"
                        ].join(" ")}
                      >
                        {f.label}
                        {f.count !== undefined && f.count > 0 ? (
                          <span className="ml-1 opacity-80">({f.count})</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {quickFoods.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {quickListFilter === "recent"
                    ? "No recent foods yet."
                    : quickListFilter === "favorites"
                      ? "No favorites yet."
                      : "No custom foods yet. Create one in the Create tab."}
                </p>
              ) : (
                <div className="space-y-2">
                  {quickFoods.map((food) => {
                    const isFavorite = favorites.includes(food.id);
                    return (
                      <div
                        key={`${quickListFilter}-${food.id}`}
                        className="rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-700 dark:ring-slate-600"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toggleFavorite(food.id)}
                                className={[
                                  "inline-flex h-6 w-6 items-center justify-center rounded-full transition",
                                  isFavorite
                                    ? "bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-400 dark:hover:bg-slate-500"
                                ].join(" ")}
                                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                              >
                                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"}>
                                  <path
                                    d="M10 16.5l-6.1-5.8a3.9 3.9 0 010-5.6 3.9 3.9 0 015.5 0L10 5.8l.6-.7a3.9 3.9 0 015.5 0 3.9 3.9 0 010 5.6L10 16.5z"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{food.name}</p>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {Math.round(food.nutrients.calories)} kcal · {food.servingSize}{food.servingUnit}
                            </p>
                          </div>
                          <button
                            onClick={() => addItemToLog(food)}
                            className="shrink-0 rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Meals */}
            <div className={innerSectionClass}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Custom Meals
              </h4>
              {customMeals.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No custom meals yet. Compose one in the Create tab.
                </p>
              ) : (
                <div className="space-y-2">
                  {customMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-100 dark:bg-slate-700 dark:ring-slate-600"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{meal.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {meal.servingSize}g · {Math.round(meal.nutrients.calories)} kcal
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingMealId(meal.id);
                              setActiveTab("create");
                            }}
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => addItemToLog(meal)}
                            className="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              deleteFood(meal.id);
                              if (editingMealId === meal.id) setEditingMealId(null);
                              showBanner(`Deleted meal ${meal.name}.`, 1500);
                            }}
                            className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-900/60"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Barcode Scan</h3>
          <BarcodeScannerPanel
            onBarcodeDetected={setBarcode}
            scannedFood={scannedFood}
            isLoading={isFetching}
            onQuickAdd={addItemToLog}
            favoriteIds={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </section>

        <section className={sectionClass}>
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Search</h3>
          <FoodSearchPanel
            onSelectFood={addItemToLog}
            favoriteIds={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </section>
      </div>
    );
  } else {
    tabContent = (
      <div className="space-y-4">
        <section className={sectionClass}>
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {editingMeal ? `Edit Meal: ${editingMeal.name}` : "Create Meal Composition"}
          </h3>
          <MealCompositionForm
            editingMeal={editingMeal}
            onCancelEdit={() => setEditingMealId(null)}
            foods={foods}
            recentFoodIds={recent}
            favoriteIds={favorites}
            onToggleFavorite={toggleFavorite}
            onSaveMeal={(meal) => {
              if (editingMealId) {
                updateFood(meal);
                setEditingMealId(null);
                showBanner(`Updated meal ${meal.name}.`);
                return;
              }
              addFood(meal);
              showBanner(`Saved meal "${meal.name}". Add it from the Add tab when ready.`, 2200);
            }}
          />
        </section>

        <section className={sectionClass}>
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Create Custom Food</h3>
          <CustomFoodForm
            onCreateFood={(food) => {
              addFood(food);
              touchRecent(food.id);
              setQuickListFilter("myfoods");
              showBanner(`Saved "${food.name}". Tap Add in the My Foods list to log it.`, 2200);
            }}
            favoriteIds={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addBanner ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {addBanner}
        </div>
      ) : null}

      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add Food</h2>

      {/* Logging context bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600"
          />
        </div>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Meal</span>
          <select
            value={mealType}
            onChange={(event) => setMealType(event.target.value as MealType)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Qty</span>
          <input
            type="number"
            step={0.25}
            min={0.25}
            value={servingsStr}
            onChange={(event) => setServingsStr(event.target.value)}
            onBlur={() => {
              const n = parseFloat(servingsStr);
              if (isNaN(n) || n <= 0) setServingsStr("1");
            }}
            className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600"
            aria-label="Servings"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">servings</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "rounded-full px-5 py-2 text-sm font-semibold",
              tab.id === activeTab
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabContent}
    </div>
  );
}
