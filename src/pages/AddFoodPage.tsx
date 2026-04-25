import { useState } from "react";
import { Card } from "@/components/common/Card";
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

export function AddFoodPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("add");
  const [quickListFilter, setQuickListFilter] = useState<"recent" | "favorites">("recent");
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [servings, setServings] = useState(1);
  const [addBanner, setAddBanner] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: scannedFood, isFetching } = useBarcodeLookup(barcode);

  const foods = useNutrientStore((state) => state.foods);
  const favorites = useNutrientStore((state) => state.favorites);
  const recent = useNutrientStore((state) => state.recentFoodIds);
  const addFood = useNutrientStore((state) => state.addFood);
  const updateFood = useNutrientStore((state) => state.updateFood);
  const deleteFood = useNutrientStore((state) => state.deleteFood);
  const addLogEntry = useNutrientStore((state) => state.addLogEntry);
  const toggleFavorite = useNutrientStore((state) => state.toggleFavorite);
  const clearRecent = useNutrientStore((state) => state.clearRecent);

  const addItemToLog = (food: FoodItem) => {
    addFood(food);
    const entry: LogEntry = {
      id: `log-${Date.now()}`,
      foodItemId: food.id,
      foodName: food.name,
      consumedAt: new Date(selectedDate).toISOString(),
      servings,
      mealType,
      nutrients: scaleNutrients(food.nutrients, servings)
    };
    addLogEntry(entry);
    setAddBanner(`Added ${food.name} (${servings} serving${servings > 1 ? "s" : ""}) to ${mealType}.`);
    window.setTimeout(() => setAddBanner(null), 1800);
  };

  const customMeals = foods.filter(
    (food) => food.source === "custom" && food.servingUnit === "g" && food.servingSize > 100
  );
  const recentFoods = recent
    .map((id) => foods.find((food) => food.id === id))
    .filter(Boolean) as FoodItem[];
  const favoriteFoods = favorites
    .map((id) => foods.find((food) => food.id === id))
    .filter(Boolean) as FoodItem[];
  const quickFoods = quickListFilter === "recent" ? recentFoods : favoriteFoods;
  const editingMeal = customMeals.find((meal) => meal.id === editingMealId) ?? null;

  let tabContent: JSX.Element;
  if (activeTab === "add") {
    tabContent = (
      <div className="space-y-3">
        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Quick Add</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Food Library</h4>
                <div className="flex items-center gap-2">
                  {quickListFilter === "recent" ? (
                    <button
                      onClick={() => clearRecent()}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Clear
                    </button>
                  ) : null}
                  <div className="rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
                  <button
                    onClick={() => setQuickListFilter("recent")}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold transition",
                      quickListFilter === "recent" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
                    ].join(" ")}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setQuickListFilter("favorites")}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold transition",
                      quickListFilter === "favorites" ? "bg-rose-500 text-white" : "text-slate-600 hover:bg-slate-100"
                    ].join(" ")}
                  >
                    Favorites
                  </button>
                  </div>
                </div>
              </div>

              {quickFoods.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {quickListFilter === "recent" ? "No recent foods yet." : "No favorites yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {quickFoods.map((food) => {
                    const isFavorite = favorites.includes(food.id);
                    return (
                      <div key={`${quickListFilter}-${food.id}`} className="rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toggleFavorite(food.id)}
                                className={[
                                  "inline-flex h-6 w-6 items-center justify-center rounded-full transition",
                                  isFavorite ? "bg-rose-100 text-rose-600 hover:bg-rose-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
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
                              <p className="truncate text-sm font-semibold text-slate-800">{food.name}</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{Math.round(food.nutrients.calories)} kcal</p>
                          </div>
                          <button
                            onClick={() => addItemToLog(food)}
                            className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
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

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Custom Meals</h4>
              {customMeals.length === 0 ? (
                <p className="text-sm text-slate-500">No custom meals yet.</p>
              ) : (
                <div className="space-y-2">
                  {customMeals.map((meal) => (
                    <div key={meal.id} className="rounded-lg bg-white p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{meal.name}</p>
                          <p className="text-xs text-slate-500">
                            {meal.servingSize}g • {Math.round(meal.nutrients.calories)} kcal
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingMealId(meal.id);
                              setActiveTab("create");
                            }}
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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
                              if (editingMealId === meal.id) {
                                setEditingMealId(null);
                              }
                              setAddBanner(`Deleted meal ${meal.name}.`);
                              window.setTimeout(() => setAddBanner(null), 1500);
                            }}
                            className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
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

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Barcode Scan</h3>
          <BarcodeScannerPanel
            onBarcodeDetected={setBarcode}
            scannedFood={scannedFood}
            isLoading={isFetching}
            onQuickAdd={addItemToLog}
            favoriteIds={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Search</h3>
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
        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {editingMeal ? `Edit Meal Composition: ${editingMeal.name}` : "Create Meal Composition"}
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
                setAddBanner(`Updated meal ${meal.name}.`);
                window.setTimeout(() => setAddBanner(null), 1800);
                return;
              }

              addFood(meal);
              setAddBanner(`Saved meal ${meal.name}. Add it from the Add tab when ready.`);
              window.setTimeout(() => setAddBanner(null), 2200);
            }}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Create Custom Food</h3>
          <CustomFoodForm
            onCreateFood={(food) => {
              addFood(food);
              setAddBanner(`Saved ${food.name}. Press Add when you want to log it.`);
              window.setTimeout(() => setAddBanner(null), 2000);
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {addBanner}
        </div>
      ) : null}
      <h2 className="text-xl font-bold text-slate-900">Add Food</h2>
      <Card
        title="Food Entry Hub"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
            />
            <select
              value={mealType}
              onChange={(event) => setMealType(event.target.value as MealType)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
            <input
              type="number"
              step={0.25}
              value={servings || ""}
              onChange={(event) => setServings(event.target.value ? Number(event.target.value) : 0)}
              className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm"
              title="Portion"
              aria-label="Portion"
            />
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold",
                tab.id === activeTab ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {tabContent}
      </Card>
    </div>
  );
}