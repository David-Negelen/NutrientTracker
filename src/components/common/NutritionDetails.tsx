import { NutrientValues } from "@/types/nutrition";

interface NutritionDetailsProps {
  nutrients: NutrientValues;
  servingSize?: number;
  servingUnit?: string;
}

export function NutritionDetails({ nutrients, servingSize, servingUnit }: NutritionDetailsProps) {
  const servingLabel = servingSize ? `per ${servingSize}${servingUnit || "g"}` : "per serving";

  return (
    <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Calories</span>
        <span className="font-semibold text-slate-900">{Math.round(nutrients.calories)}</span>
      </div>
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Protein</span>
        <span className="font-semibold text-slate-900">{nutrients.protein.toFixed(1)}g</span>
      </div>
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Carbs</span>
        <span className="font-semibold text-slate-900">{nutrients.carbs.toFixed(1)}g</span>
      </div>
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Fat</span>
        <span className="font-semibold text-slate-900">{nutrients.fat.toFixed(1)}g</span>
      </div>
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Fiber</span>
        <span className="font-semibold text-slate-900">{nutrients.fiber.toFixed(1)}g</span>
      </div>
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Sugar</span>
        <span className="font-semibold text-slate-900">{nutrients.sugar.toFixed(1)}g</span>
      </div>
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Sodium</span>
        <span className="font-semibold text-slate-900">{nutrients.sodium.toFixed(0)}mg</span>
      </div>
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Vitamin A</span>
        <span className="font-semibold text-slate-900">{nutrients.vitaminA.toFixed(0)}µg</span>
      </div>
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Vitamin C</span>
        <span className="font-semibold text-slate-900">{nutrients.vitaminC.toFixed(1)}mg</span>
      </div>
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Calcium</span>
        <span className="font-semibold text-slate-900">{nutrients.calcium.toFixed(0)}mg</span>
      </div>
      <div className="flex justify-between rounded bg-slate-50 px-2 py-1">
        <span className="text-slate-600">Iron</span>
        <span className="font-semibold text-slate-900">{nutrients.iron.toFixed(2)}mg</span>
      </div>
      <div className="col-span-2 text-center text-xs text-slate-500 md:col-span-3">{servingLabel}</div>
    </div>
  );
}
