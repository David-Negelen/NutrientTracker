import { useEffect, useRef, useState } from "react";
import { FoodItem, LogEntry } from "@/types/nutrition";
import { NutritionDetails } from "@/components/common/NutritionDetails";

interface MealGroupSectionProps {
  title: string;
  entries: LogEntry[];
  foods: FoodItem[];
  isDragOver: boolean;
  onDragStartCard: (entryId: string) => void;
  onUpdateEntry: (entryId: string, updates: Partial<Pick<LogEntry, "servings">>) => void;
  onDeleteEntry: (entryId: string) => void;
}

function MealEntryRow({
  entry,
  food,
  onUpdateEntry,
  onDeleteEntry,
  onDragStart
}: {
  entry: LogEntry;
  food: FoodItem | undefined;
  onUpdateEntry: MealGroupSectionProps["onUpdateEntry"];
  onDeleteEntry: MealGroupSectionProps["onDeleteEntry"];
  onDragStart: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [useGrams, setUseGrams] = useState(false);
  const [inputStr, setInputStr] = useState(() => String(entry.servings));

  const servingSize = food?.servingSize;
  const canUseGrams = typeof servingSize === "number" && servingSize > 0;

  const lastServingsRef = useRef(entry.servings);
  useEffect(() => {
    if (lastServingsRef.current !== entry.servings) {
      lastServingsRef.current = entry.servings;
      setInputStr(
        useGrams && canUseGrams
          ? String(Math.round(entry.servings * servingSize!))
          : String(entry.servings)
      );
    }
  }, [entry.servings, useGrams, canUseGrams, servingSize]);

  const handleChange = (val: string) => {
    setInputStr(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const newServings = useGrams && canUseGrams ? num / servingSize! : num;
      onUpdateEntry(entry.id, { servings: newServings });
    }
  };

  const handleBlur = () => {
    const num = parseFloat(inputStr);
    if (isNaN(num) || num <= 0) {
      setInputStr(
        useGrams && canUseGrams
          ? String(Math.round(entry.servings * servingSize!))
          : String(entry.servings)
      );
    }
  };

  const toggleUnit = () => {
    const next = !useGrams;
    setUseGrams(next);
    setInputStr(
      next && canUseGrams
        ? String(Math.round(entry.servings * servingSize!))
        : String(entry.servings)
    );
  };

  return (
    <li
      className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
      draggable
      onDragStart={onDragStart}
    >
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <p className="font-medium text-slate-800 dark:text-slate-200">{entry.foodName}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{Math.round(entry.nutrients.calories)} kcal</p>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          P {entry.nutrients.protein.toFixed(1)}g · C {entry.nutrients.carbs.toFixed(1)}g · F {entry.nutrients.fat.toFixed(1)}g
        </p>
      </button>

      {isExpanded && (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
          <NutritionDetails
            nutrients={entry.nutrients}
            servingSize={entry.servings}
            servingUnit={`servings (${(entry.nutrients.calories / entry.servings).toFixed(0)} kcal each)`}
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          step={useGrams ? 5 : 0.25}
          min={useGrams ? 1 : 0.25}
          value={inputStr}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <button
          onClick={canUseGrams ? toggleUnit : undefined}
          className={[
            "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
            canUseGrams
              ? "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              : "cursor-default border-transparent text-slate-400 dark:text-slate-500"
          ].join(" ")}
          title={canUseGrams ? "Toggle between grams and servings" : undefined}
        >
          {useGrams ? "g" : "servings"}
        </button>
        <button
          onClick={() => onDeleteEntry(entry.id)}
          className="rounded-lg bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export function MealGroupSection({
  title,
  entries,
  foods,
  isDragOver,
  onDragStartCard,
  onUpdateEntry,
  onDeleteEntry
}: MealGroupSectionProps) {
  return (
    <section
      className={[
        "card-surface p-5 transition-colors",
        isDragOver ? "ring-2 ring-brand-400 ring-offset-1" : ""
      ].join(" ")}
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{entries.length} items</p>
      </header>

      {isDragOver ? (
        <p className="mb-2 text-xs font-semibold text-brand-700 dark:text-brand-400">Drop here</p>
      ) : null}

      <ul className="space-y-3">
        {entries.length === 0 ? (
          <li className="text-sm text-slate-400 dark:text-slate-500">No entries yet.</li>
        ) : null}
        {entries.map((entry) => {
          const food = foods.find((f) => f.id === entry.foodItemId);
          return (
            <MealEntryRow
              key={entry.id}
              entry={entry}
              food={food}
              onUpdateEntry={onUpdateEntry}
              onDeleteEntry={onDeleteEntry}
              onDragStart={() => onDragStartCard(entry.id)}
            />
          );
        })}
      </ul>
    </section>
  );
}
