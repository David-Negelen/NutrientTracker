import { FormEvent, useState } from "react";
import { FoodItem } from "@/types/nutrition";

interface CustomFoodFormProps {
  onCreateFood: (food: FoodItem) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (foodId: string) => void;
}

const nutrientFields: Array<keyof FoodItem["nutrients"]> = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "sodium",
  "vitaminA",
  "vitaminC",
  "calcium",
  "iron"
];

export function CustomFoodForm({ onCreateFood, favoriteIds = [], onToggleFavorite }: CustomFoodFormProps) {
  const [name, setName] = useState("");
  const [servingSize, setServingSize] = useState(100);
  const [servingUnit, setServingUnit] = useState("g");
  const [nutrients, setNutrients] = useState<Record<string, number>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const food: FoodItem = {
      id: `custom-${Date.now()}`,
      name,
      servingSize,
      servingUnit,
      source: "custom",
      nutrients: {
        calories: nutrients.calories || 0,
        protein: nutrients.protein || 0,
        carbs: nutrients.carbs || 0,
        fat: nutrients.fat || 0,
        fiber: nutrients.fiber || 0,
        sugar: nutrients.sugar || 0,
        sodium: nutrients.sodium || 0,
        vitaminA: nutrients.vitaminA || 0,
        vitaminC: nutrients.vitaminC || 0,
        calcium: nutrients.calcium || 0,
        iron: nutrients.iron || 0
      }
    };
    onCreateFood(food);
    setName("");
    setNutrients({});
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Food name"
          className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2"
          required
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={servingSize || ""}
            onChange={(event) => setServingSize(event.target.value ? Number(event.target.value) : 0)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            value={servingUnit}
            onChange={(event) => setServingUnit(event.target.value)}
            className="w-24 rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {nutrientFields.map((field) => (
          <label key={field} className="text-sm text-slate-600">
            <span className="mb-1 block capitalize">{field}</span>
            <input
              type="number"
              step="0.1"
              value={nutrients[field] ?? ""}
              onChange={(event) =>
                setNutrients((prev) => ({
                  ...prev,
                  [field]: event.target.value ? Number(event.target.value) : 0
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        ))}
      </div>

      <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700">
        Save custom food
      </button>
    </form>
  );
}