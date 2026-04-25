import { useState } from "react";
import { FoodItem } from "@/types/nutrition";
import { NutritionDetails } from "@/components/common/NutritionDetails";

interface RecentFavoritesPanelProps {
  foods: FoodItem[];
  recentFoodIds: string[];
  favoriteIds: string[];
  onQuickAdd: (food: FoodItem) => void;
  onToggleFavorite: (foodId: string) => void;
}

function FoodListItem({ food, onAdd, onToggleFavorite, isFavorite }: { food: FoodItem; onAdd: () => void; onToggleFavorite: () => void; isFavorite: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div key={food.id} className="rounded-lg bg-slate-50 p-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700">{food.name}</p>
            <p className="text-xs text-slate-500">{Math.round(food.nutrients.calories)} kcal</p>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="mt-2 border-t border-slate-200 pt-2">
          <NutritionDetails nutrients={food.nutrients} servingSize={food.servingSize} servingUnit={food.servingUnit} />
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <button onClick={onAdd} className="flex-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
          Add
        </button>
        <button onClick={onToggleFavorite} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
          {isFavorite ? "Remove" : "Favorite"}
        </button>
      </div>
    </div>
  );
}

export function RecentFavoritesPanel({
  foods,
  recentFoodIds,
  favoriteIds,
  onQuickAdd,
  onToggleFavorite
}: RecentFavoritesPanelProps) {
  const recentFoods = recentFoodIds.map((id) => foods.find((food) => food.id === id)).filter(Boolean) as FoodItem[];
  const favoriteFoods = favoriteIds.map((id) => foods.find((food) => food.id === id)).filter(Boolean) as FoodItem[];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-slate-100 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Foods</h4>
        <div className="space-y-2">
          {recentFoods.map((food) => (
            <FoodListItem
              key={food.id}
              food={food}
              onAdd={() => onQuickAdd(food)}
              onToggleFavorite={() => onToggleFavorite(food.id)}
              isFavorite={favoriteIds.includes(food.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Favorites</h4>
        <div className="space-y-2">
          {favoriteFoods.map((food) => (
            <FoodListItem
              key={food.id}
              food={food}
              onAdd={() => onQuickAdd(food)}
              onToggleFavorite={() => onToggleFavorite(food.id)}
              isFavorite={true}
            />
          ))}
        </div>
      </section>
    </div>
  );
}