import { useState } from "react";
import { LogEntry } from "@/types/nutrition";
import { NutritionDetails } from "@/components/common/NutritionDetails";

interface MealGroupSectionProps {
  title: string;
  entries: LogEntry[];
  isDragOver: boolean;
  onDragStartCard: (entryId: string) => void;
  onUpdateEntry: (entryId: string, updates: Partial<Pick<LogEntry, "servings">>) => void;
  onDeleteEntry: (entryId: string) => void;
}

export function MealGroupSection({
  title,
  entries,
  isDragOver,
  onDragStartCard,
  onUpdateEntry,
  onDeleteEntry
}: MealGroupSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <section
      className={[
        "card-surface p-5 transition",
        isDragOver ? "ring-2 ring-brand-400 ring-offset-1" : ""
      ].join(" ")}
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{entries.length} items</p>
      </header>

      {isDragOver ? <p className="mb-2 text-xs font-semibold text-brand-700">Drop here</p> : null}

      <ul className="space-y-3">
        {entries.length === 0 ? <li className="text-sm text-slate-500">No entries yet.</li> : null}
        {entries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          return (
            <li
              key={entry.id}
              className="rounded-xl border border-slate-100 bg-white p-3"
              draggable
              onDragStart={() => onDragStartCard(entry.id)}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">{entry.foodName}</p>
                  <p className="text-sm text-slate-500">{Math.round(entry.nutrients.calories)} kcal</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  P {entry.nutrients.protein.toFixed(1)}g | C {entry.nutrients.carbs.toFixed(1)}g | F {entry.nutrients.fat.toFixed(1)}g
                </p>
              </button>
              {isExpanded && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <NutritionDetails
                    nutrients={entry.nutrients}
                    servingSize={entry.servings}
                    servingUnit={`servings (${(entry.nutrients.calories / entry.servings).toFixed(0)} kcal each)`}
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-slate-400">Drag to another meal section</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="text-xs text-slate-500">Servings</label>
                <input
                  type="number"
                  step={0.25}
                  value={entry.servings || ""}
                  onChange={(event) => onUpdateEntry(entry.id, { servings: event.target.value ? Number(event.target.value) : 0 })}
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                />
                <button
                  onClick={() => onDeleteEntry(entry.id)}
                  className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}