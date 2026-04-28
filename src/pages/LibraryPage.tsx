import { useState } from "react";
import { BarcodeScannerPanel } from "@/components/add/BarcodeScannerPanel";
import { CustomFoodForm } from "@/components/add/CustomFoodForm";
import { FoodSearchPanel } from "@/components/add/FoodSearchPanel";
import { MealCompositionForm } from "@/components/add/MealCompositionForm";
import { useBarcodeLookup } from "@/hooks/useFoodQueries";
import { useNutrientStore } from "@/store/useNutrientStore";
import { FoodItem, LogEntry, MealType, scaleNutrients } from "@/types/nutrition";

type FilterTab = "recent" | "favorites" | "myfoods" | "meals" | "all";
type SortKey = "name" | "calories" | "protein";
type ActivePanel = "search" | "scan" | "custom" | "meal" | null;

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface FoodRowProps {
  food: FoodItem;
  isFavorite: boolean;
  isConfirmingDelete: boolean;
  onAdd: () => void;
  onFavorite: () => void;
  onEdit?: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function FoodRow({ food, isFavorite, isConfirmingDelete, onAdd, onFavorite, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel }: FoodRowProps) {
  const isMeal = Boolean(food.mealComposition?.length);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={[
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
            isMeal
              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
          ].join(" ")}>
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
          <span className="text-slate-400 dark:text-slate-500">{food.servingSize}{food.servingUnit} / serving</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={onFavorite}
          className={[
            "rounded-lg px-2.5 py-1.5 text-sm font-semibold transition",
            isFavorite
              ? "bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-900/60"
              : "border border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
          ].join(" ")}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? "♥" : "♡"}
        </button>

        <button
          onClick={onAdd}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Add
        </button>

        {onEdit ? (
          <button
            onClick={onEdit}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Edit
          </button>
        ) : null}

        {isConfirmingDelete ? (
          <>
            <button onClick={onDeleteConfirm} className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
              Confirm
            </button>
            <button onClick={onDeleteCancel} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={onDeleteRequest}
            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

const filterTabs: Array<{ id: FilterTab; label: string }> = [
  { id: "recent", label: "Recent" },
  { id: "favorites", label: "Favorites" },
  { id: "myfoods", label: "My Foods" },
  { id: "meals", label: "Meals" },
  { id: "all", label: "All" },
];

const actionButtons: Array<{ id: NonNullable<ActivePanel>; label: string }> = [
  { id: "search", label: "Search" },
  { id: "scan", label: "Scan Barcode" },
  { id: "custom", label: "Custom Food" },
  { id: "meal", label: "New Meal" },
];

export function LibraryPage() {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [servingsStr, setServingsStr] = useState("1");
  const [banner, setBanner] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [filter, setFilter] = useState<FilterTab>("recent");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const { data: scannedFood, isFetching: isScanFetching } = useBarcodeLookup(barcode);
  const servingsNum = Math.max(0.25, parseFloat(servingsStr) || 1);

  const foods = useNutrientStore((s) => s.foods);
  const favorites = useNutrientStore((s) => s.favorites);
  const recentFoodIds = useNutrientStore((s) => s.recentFoodIds);
  const addFood = useNutrientStore((s) => s.addFood);
  const updateFood = useNutrientStore((s) => s.updateFood);
  const deleteFood = useNutrientStore((s) => s.deleteFood);
  const addLogEntry = useNutrientStore((s) => s.addLogEntry);
  const toggleFavorite = useNutrientStore((s) => s.toggleFavorite);
  const touchRecent = useNutrientStore((s) => s.touchRecent);
  const clearRecent = useNutrientStore((s) => s.clearRecent);

  const showBanner = (msg: string, ms = 2000) => {
    setBanner(msg);
    window.setTimeout(() => setBanner(null), ms);
  };

  const addToLog = (food: FoodItem) => {
    addFood(food);
    touchRecent(food.id);
    const entry: LogEntry = {
      id: `log-${Date.now()}`,
      foodItemId: food.id,
      foodName: food.name,
      consumedAt: new Date(selectedDate + "T12:00:00").toISOString(),
      servings: servingsNum,
      mealType,
      nutrients: scaleNutrients(food.nutrients, servingsNum),
    };
    addLogEntry(entry);
    showBanner(`Added ${food.name} (×${servingsNum}) to ${mealType}.`);
  };

  const customFoods = foods.filter((f) => f.source === "custom" && (!f.mealComposition || f.mealComposition.length === 0));
  const customMeals = foods.filter((f) => f.source === "custom" && f.mealComposition && f.mealComposition.length > 0);
  const recentFoods = recentFoodIds.map((id) => foods.find((f) => f.id === id)).filter(Boolean) as FoodItem[];
  const favoriteFoods = favorites.map((id) => foods.find((f) => f.id === id)).filter(Boolean) as FoodItem[];
  const editingMeal = customMeals.find((m) => m.id === editingMealId) ?? null;

  const tabCounts: Record<FilterTab, number> = {
    recent: recentFoods.length,
    favorites: favoriteFoods.length,
    myfoods: customFoods.length,
    meals: customMeals.length,
    all: foods.length,
  };

  const basePool: FoodItem[] =
    filter === "recent" ? recentFoods
    : filter === "favorites" ? favoriteFoods
    : filter === "myfoods" ? customFoods
    : filter === "meals" ? customMeals
    : foods;

  const afterSearch = search.trim()
    ? basePool.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.brand?.toLowerCase().includes(search.toLowerCase())
      )
    : basePool;

  const sorted = filter === "recent"
    ? afterSearch
    : [...afterSearch].sort((a, b) => {
        if (sortKey === "calories") return b.nutrients.calories - a.nutrients.calories;
        if (sortKey === "protein") return b.nutrients.protein - a.nutrients.protein;
        return a.name.localeCompare(b.name);
      });

  const togglePanel = (panel: NonNullable<ActivePanel>) => {
    if (panel !== "meal") setEditingMealId(null);
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const openMealEditor = (mealId: string) => {
    setEditingMealId(mealId);
    setActivePanel("meal");
  };

  const sectionClass = "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60";

  return (
    <div className="space-y-4">
      {banner ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {banner}
        </div>
      ) : null}

      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Library</h2>

      {/* Logging context */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Meal</span>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
            onChange={(e) => setServingsStr(e.target.value)}
            onBlur={() => { const n = parseFloat(servingsStr); if (isNaN(n) || n <= 0) setServingsStr("1"); }}
            className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            aria-label="Servings"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">servings</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {actionButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => togglePanel(btn.id)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              activePanel === btn.id
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            ].join(" ")}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      {activePanel ? (
        <div className={sectionClass}>
          {activePanel === "search" && (
            <FoodSearchPanel onSelectFood={addToLog} favoriteIds={favorites} onToggleFavorite={toggleFavorite} />
          )}
          {activePanel === "scan" && (
            <BarcodeScannerPanel
              onBarcodeDetected={setBarcode}
              scannedFood={scannedFood}
              isLoading={isScanFetching}
              onQuickAdd={addToLog}
              favoriteIds={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}
          {activePanel === "custom" && (
            <CustomFoodForm
              onCreateFood={(food) => {
                addFood(food);
                touchRecent(food.id);
                showBanner(`Saved "${food.name}". Find it in My Foods to add it to the log.`, 2500);
              }}
              favoriteIds={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}
          {activePanel === "meal" && (
            <MealCompositionForm
              editingMeal={editingMeal}
              onCancelEdit={() => { setEditingMealId(null); setActivePanel(null); }}
              foods={foods}
              recentFoodIds={recentFoodIds}
              favoriteIds={favorites}
              onToggleFavorite={toggleFavorite}
              onSaveMeal={(meal) => {
                if (editingMealId) {
                  updateFood(meal);
                  setEditingMealId(null);
                  setActivePanel(null);
                  showBanner(`Updated meal "${meal.name}".`);
                } else {
                  addFood(meal);
                  setActivePanel(null);
                  showBanner(`Saved meal "${meal.name}". Find it in Meals to add it to the log.`, 2500);
                }
              }}
            />
          )}
        </div>
      ) : null}

      {/* Library list */}
      <div className="space-y-3">
        {/* Filter tabs + controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  filter === tab.id
                    ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                ].join(" ")}
              >
                {tab.label}
                {tabCounts[tab.id] > 0 ? <span className="ml-1 opacity-60">({tabCounts[tab.id]})</span> : null}
              </button>
            ))}
          </div>

          {filter === "recent" && recentFoods.length > 0 ? (
            <button
              onClick={clearRecent}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Clear recent
            </button>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 rounded-xl border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
            {filter !== "recent" ? (
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-xl border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="name">Name</option>
                <option value="calories">Calories</option>
                <option value="protein">Protein</option>
              </select>
            ) : null}
          </div>
        </div>

        {/* Rows */}
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {search
                ? `No results for "${search}".`
                : filter === "recent"
                  ? "No recent foods yet. Add something to the log first."
                  : filter === "favorites"
                    ? "No favorites yet. Tap the heart on any food."
                    : filter === "myfoods"
                      ? "No custom foods yet. Use Custom Food to create one."
                      : filter === "meals"
                        ? "No meals yet. Use New Meal to compose one."
                        : "Your library is empty."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((food) => (
              <FoodRow
                key={food.id}
                food={food}
                isFavorite={favorites.includes(food.id)}
                isConfirmingDelete={confirmingDeleteId === food.id}
                onAdd={() => addToLog(food)}
                onFavorite={() => toggleFavorite(food.id)}
                onEdit={food.mealComposition?.length ? () => openMealEditor(food.id) : undefined}
                onDeleteRequest={() => setConfirmingDeleteId(food.id)}
                onDeleteConfirm={() => {
                  deleteFood(food.id);
                  if (editingMealId === food.id) { setEditingMealId(null); setActivePanel(null); }
                  setConfirmingDeleteId(null);
                }}
                onDeleteCancel={() => setConfirmingDeleteId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
