import { FormEvent, useState } from "react";
import { FoodItem } from "@/types/nutrition";

interface CustomFoodFormProps {
  onCreateFood: (food: FoodItem) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (foodId: string) => void;
}

const nutrientFields: Array<{ key: keyof FoodItem["nutrients"]; label: string; unit: string }> = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

export function CustomFoodForm({ onCreateFood }: CustomFoodFormProps) {
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
        sugar: nutrients.sugar || 0
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
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 md:col-span-2"
          required
        />
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={servingSize || ""}
            onChange={(event) => setServingSize(event.target.value ? Number(event.target.value) : 0)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600"
            placeholder="100"
          />
          <input
            value={servingUnit}
            onChange={(event) => setServingUnit(event.target.value)}
            className="w-20 rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600"
            placeholder="g"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {nutrientFields.map((field) => (
          <label key={field.key} className="text-sm text-slate-600 dark:text-slate-400">
            <span className="mb-1.5 block font-medium">
              {field.label}{" "}
              <span className="font-normal text-slate-400 dark:text-slate-500">({field.unit})</span>
            </span>
            <input
              type="number"
              step="0.1"
              min={0}
              value={nutrients[field.key] ?? ""}
              onChange={(event) =>
                setNutrients((prev) => ({
                  ...prev,
                  [field.key]: event.target.value ? Number(event.target.value) : 0
                }))
              }
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700"
      >
        Save custom food
      </button>
    </form>
  );
}
