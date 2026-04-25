import { useState } from "react";
import { MealGroupSection } from "@/components/log/MealGroupSection";
import { useNutrientStore } from "@/store/useNutrientStore";
import { MealType, scaleNutrients } from "@/types/nutrition";

const MEALS = [
  { id: "breakfast", title: "Breakfast" },
  { id: "lunch", title: "Lunch" },
  { id: "dinner", title: "Dinner" },
  { id: "snack", title: "Snacks" }
] as const;

const formatIsoDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseIsoDateLocal = (dateIso: string) => {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export function LogPage() {
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [dragOverMeal, setDragOverMeal] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const foods = useNutrientStore((state) => state.foods);
  const entries = useNutrientStore((state) => state.entries);
  const updateLogEntry = useNutrientStore((state) => state.updateLogEntry);
  const removeLogEntry = useNutrientStore((state) => state.removeLogEntry);
  const selectedDateObj = parseIsoDateLocal(selectedDate);

  const shiftDate = (deltaDays: number) => {
    const next = parseIsoDateLocal(selectedDate);
    next.setDate(next.getDate() + deltaDays);
    setSelectedDate(formatIsoDateLocal(next));
  };

  const goToToday = () => {
    setSelectedDate(formatIsoDateLocal(new Date()));
  };

  const todayEntries = entries.filter(
    (entry) => new Date(entry.consumedAt).toDateString() === selectedDateObj.toDateString()
  );

  const handleUpdateEntry = (entryId: string, updates: { servings?: number; mealType?: MealType }) => {
    const entry = entries.find((item) => item.id === entryId);
    if (!entry) return;

    const nextServings = updates.servings ?? entry.servings;
    const baseFood = foods.find((food) => food.id === entry.foodItemId);
    const nextNutrients = baseFood ? scaleNutrients(baseFood.nutrients, nextServings) : entry.nutrients;

    updateLogEntry(entryId, {
      ...updates,
      servings: nextServings,
      nutrients: nextNutrients
    });
  };

  const handleDropToMeal = (mealId: string) => {
    if (!draggedEntryId) return;
    handleUpdateEntry(draggedEntryId, { mealType: mealId as MealType });
    setDraggedEntryId(null);
    setDragOverMeal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Daily Food Log</h2>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => shiftDate(-1)}
            className="rounded px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            title="Previous day"
            aria-label="Previous day"
          >
            ←
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            onClick={goToToday}
            className="rounded px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Today
          </button>
          <button
            onClick={() => shiftDate(1)}
            className="rounded px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            title="Next day"
            aria-label="Next day"
          >
            →
          </button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {MEALS.map((meal) => (
          <div
            key={meal.id}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverMeal(meal.id);
            }}
            onDragLeave={() => setDragOverMeal((current) => (current === meal.id ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              handleDropToMeal(meal.id);
            }}
          >
            <MealGroupSection
              title={meal.title}
              entries={todayEntries.filter((entry) => entry.mealType === meal.id)}
              isDragOver={dragOverMeal === meal.id}
              onDragStartCard={setDraggedEntryId}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={removeLogEntry}
            />
          </div>
        ))}
      </div>
    </div>
  );
}