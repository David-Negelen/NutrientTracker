import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarcodeScannerPanel } from "@/components/add/BarcodeScannerPanel";
import { NutritionDetails } from "@/components/common/NutritionDetails";
import { useBarcodeLookup } from "@/hooks/useFoodQueries";
import { FoodItem, NutrientValues, emptyNutrients, scaleNutrients } from "@/types/nutrition";

interface MealCompositionFormProps {
  onSaveMeal: (meal: FoodItem) => void;
  editingMeal?: FoodItem | null;
  onCancelEdit?: () => void;
  foods: FoodItem[];
  recentFoodIds: string[];
  favoriteIds: string[];
  onToggleFavorite: (foodId: string) => void;
}

interface CompositionItem {
  id: string;
  food: FoodItem;
  grams: number;
}

function RecentAndFavoritesPicker({
  foods,
  recentFoodIds,
  favoriteIds,
  onToggleFavorite,
  onAdd
}: {
  foods: FoodItem[];
  recentFoodIds: string[];
  favoriteIds: string[];
  onToggleFavorite: (foodId: string) => void;
  onAdd: (food: FoodItem) => void;
}) {
  const recentFoods = recentFoodIds
    .map((id) => foods.find((food) => food.id === id))
    .filter(Boolean) as FoodItem[];
  const favoriteFoods = favoriteIds
    .map((id) => foods.find((food) => food.id === id))
    .filter(Boolean) as FoodItem[];

  const renderList = (title: string, list: FoodItem[]) => (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">No items yet.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((food) => (
            <li key={`${title}-${food.id}`} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{food.name}</p>
                  <p className="text-xs text-slate-500">{Math.round(food.nutrients.calories)} kcal</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(food.id)}
                    className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    {favoriteIds.includes(food.id) ? "Saved" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdd(food)}
                    className="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {renderList("Recent", recentFoods)}
      {renderList("Favorites", favoriteFoods)}
    </div>
  );
}

export function MealCompositionForm({
  onSaveMeal,
  editingMeal = null,
  onCancelEdit,
  foods,
  recentFoodIds,
  favoriteIds,
  onToggleFavorite
}: MealCompositionFormProps) {
  const [mealName, setMealName] = useState("");
  const [items, setItems] = useState<CompositionItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [barcode, setBarcode] = useState("");

  const { data: scannedFood, isFetching: isBarcodeLoading } = useBarcodeLookup(barcode);
  const isEditing = Boolean(editingMeal);

  useEffect(() => {
    if (!editingMeal) {
      return;
    }

    setMealName(editingMeal.name);
    setItems(
      (editingMeal.mealComposition ?? []).map((entry) => ({
        id: `ingredient-${Date.now()}-${Math.random()}`,
        food: entry.food,
        grams: Math.max(1, entry.grams)
      }))
    );
    setShowPicker(false);
    setBarcode("");
  }, [editingMeal]);

  const addIngredient = (food: FoodItem, grams = 100) => {
    const nextItem: CompositionItem = {
      id: `ingredient-${Date.now()}-${Math.random()}`,
      food,
      grams: Math.max(1, grams)
    };

    setItems((current) => [...current, nextItem]);
  };

  const updateGrams = (itemId: string, grams: number) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, grams: Math.max(1, grams) } : item))
    );
  };

  const removeIngredient = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const combinedNutrients = useMemo((): NutrientValues => {
    const combined = emptyNutrients();

    items.forEach((item) => {
      const factor = item.grams / item.food.servingSize;
      const scaled = scaleNutrients(item.food.nutrients, factor);

      (Object.keys(combined) as Array<keyof NutrientValues>).forEach((key) => {
        combined[key] += scaled[key];
      });
    });

    return combined;
  }, [items]);

  const totalGrams = items.reduce((sum, item) => sum + item.grams, 0);

  const resetForm = () => {
    setMealName("");
    setItems([]);
    setShowPicker(false);
    setBarcode("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!mealName.trim() || items.length === 0) {
      alert("Please enter a meal name and add at least one ingredient.");
      return;
    }

    const meal: FoodItem = {
      id: editingMeal?.id ?? `meal-${Date.now()}`,
      name: mealName.trim(),
      servingSize: totalGrams,
      servingUnit: "g",
      source: "custom",
      nutrients: combinedNutrients,
      mealComposition: items.map((item) => ({
        food: item.food,
        grams: item.grams
      }))
    };

    onSaveMeal(meal);

    if (isEditing) {
      onCancelEdit?.();
      return;
    }

    resetForm();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="block text-sm font-semibold text-slate-700">Meal name</label>
          {isEditing ? (
            <button
              type="button"
              onClick={() => {
                onCancelEdit?.();
                resetForm();
              }}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
        <input
          value={mealName}
          onChange={(event) => setMealName(event.target.value)}
          placeholder="e.g., Chicken Rice Bowl"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          required
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Ingredients</h3>
          <p className="text-xs text-slate-500">
            {items.length} item{items.length === 1 ? "" : "s"} · {totalGrams}g
          </p>
        </div>

        {isEditing && !editingMeal?.mealComposition?.length ? (
          <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            This older meal has no saved ingredient breakdown. Add ingredients below and save to rebuild it.
          </p>
        ) : null}

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
            No ingredients yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{item.food.name}</p>
                    <p className="text-xs text-slate-500">{Math.round(item.food.nutrients.calories)} kcal / serving</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(item.id)}
                    className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Amount</span>
                  <input
                    type="number"
                    min={1}
                    value={item.grams || ""}
                    onChange={(event) => updateGrams(item.id, event.target.value ? Number(event.target.value) : 0)}
                    className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-slate-500">g</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setShowPicker((current) => !current)}
          className="mt-3 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {showPicker ? "Close Add Food" : "Add Food"}
        </button>
      </div>

      {showPicker ? (
        <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50 p-3">
          <RecentAndFavoritesPicker
            foods={foods}
            recentFoodIds={recentFoodIds}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            onAdd={(food) => addIngredient(food)}
          />

          <section className="rounded-xl border border-slate-200 bg-white p-3">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Add From Barcode</h4>
            <BarcodeScannerPanel
              onBarcodeDetected={setBarcode}
              scannedFood={scannedFood}
              isLoading={isBarcodeLoading}
              onQuickAdd={(food) => addIngredient(food)}
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
            />
          </section>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Meal Nutrition Preview</h3>
          <NutritionDetails nutrients={combinedNutrients} servingSize={totalGrams} servingUnit="g" />
        </div>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
      >
        {isEditing ? "Save Meal Changes" : "Save Meal Composition"}
      </button>
    </form>
  );
}
