import type { LogEntry, NutrientValues } from "@/types/nutrition";

interface NutrientBreakdownPanelProps {
  nutrientKey: keyof NutrientValues;
  unit: string;
  entries: LogEntry[];
}

export function NutrientBreakdownPanel({ nutrientKey, unit, entries }: NutrientBreakdownPanelProps) {
  const items = entries
    .map((entry) => ({ name: entry.foodName, amount: (entry.nutrients[nutrientKey] ?? 0) as number }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">No entries logged</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, index) => {
        const pct = total > 0 ? (item.amount / total) * 100 : 0;
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{item.name}</p>
              <p className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {item.amount.toFixed(1)} {unit}
              </p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      <div className="mt-1 flex items-baseline justify-between border-t border-slate-100 pt-2 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total</p>
        <p className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
          {total.toFixed(1)} {unit}
        </p>
      </div>
    </div>
  );
}
