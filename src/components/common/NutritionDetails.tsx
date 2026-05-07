import { NutrientValues } from "@/types/nutrition";

interface NutritionDetailsProps {
  nutrients: NutrientValues;
  servingSize?: number;
  servingUnit?: string;
}

interface NutrientRow {
  label: string;
  value: string;
  note?: string;
}

export function NutritionDetails({ nutrients, servingSize, servingUnit }: NutritionDetailsProps) {
  const servingLabel = servingSize ? `per ${servingSize}${servingUnit || "g"}` : "per serving";

  const rows: NutrientRow[] = [
    { label: "Calories", value: `${Math.round(nutrients.calories)} kcal` },
    { label: "Protein", value: `${nutrients.protein.toFixed(1)} g` },
    { label: "Carbs", value: `${nutrients.carbs.toFixed(1)} g` },
    { label: "Fat", value: `${nutrients.fat.toFixed(1)} g` },
    { label: "Fiber", value: `${nutrients.fiber.toFixed(1)} g` },
    {
      label: nutrients.addedSugar !== undefined ? "Added Sugar" : "Sugar",
      value: `${(nutrients.addedSugar ?? nutrients.sugar).toFixed(1)} g`,
      note: nutrients.addedSugar !== undefined
        ? `total: ${nutrients.sugar.toFixed(1)} g`
        : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5 text-xs md:grid-cols-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800"
        >
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{row.value}</span>
          </div>
          {row.note ? (
            <span className="mt-0.5 text-right text-[10px] text-amber-600 dark:text-amber-400">
              {row.note}
            </span>
          ) : null}
        </div>
      ))}
      <div className="col-span-2 pt-1 text-center text-[10px] text-slate-400 dark:text-slate-500 md:col-span-3">
        {servingLabel}
      </div>
    </div>
  );
}
