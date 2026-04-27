import { useState } from "react";
import { MealGroupSection } from "@/components/log/MealGroupSection";
import { useNutrientStore } from "@/store/useNutrientStore";
import { DEFAULT_WATER_GOAL_ML, MealType, scaleNutrients } from "@/types/nutrition";

const MEALS = [
  { id: "breakfast", title: "Breakfast" },
  { id: "lunch", title: "Lunch" },
  { id: "dinner", title: "Dinner" },
  { id: "snack", title: "Snacks" }
] as const;

const WATER_PRESETS = [150, 250, 330, 500, 700];

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
  const [customWaterStr, setCustomWaterStr] = useState("200");
  const customWaterMl = parseFloat(customWaterStr) || 0;

  const foods = useNutrientStore((state) => state.foods);
  const entries = useNutrientStore((state) => state.entries);
  const waterEntries = useNutrientStore((state) => state.waterEntries);
  const profile = useNutrientStore((state) => state.profile);
  const updateLogEntry = useNutrientStore((state) => state.updateLogEntry);
  const removeLogEntry = useNutrientStore((state) => state.removeLogEntry);
  const addWater = useNutrientStore((state) => state.addWater);
  const removeWater = useNutrientStore((state) => state.removeWater);

  const selectedDateObj = parseIsoDateLocal(selectedDate);
  const waterGoal = profile.waterGoalMl ?? DEFAULT_WATER_GOAL_ML;
  const todayWaterEntries = waterEntries.filter((e) => e.dateIso === selectedDate);
  const totalWaterMl = todayWaterEntries.reduce((sum, e) => sum + e.amount, 0);
  const waterPct = Math.min(100, Math.round((totalWaterMl / waterGoal) * 100));

  const shiftDate = (deltaDays: number) => {
    const next = parseIsoDateLocal(selectedDate);
    next.setDate(next.getDate() + deltaDays);
    setSelectedDate(formatIsoDateLocal(next));
  };

  const goToToday = () => setSelectedDate(formatIsoDateLocal(new Date()));

  const todayEntries = entries.filter(
    (entry) => new Date(entry.consumedAt).toDateString() === selectedDateObj.toDateString()
  );

  const handleUpdateEntry = (entryId: string, updates: { servings?: number; mealType?: MealType }) => {
    const entry = entries.find((item) => item.id === entryId);
    if (!entry) return;
    const nextServings = updates.servings ?? entry.servings;
    const baseFood = foods.find((food) => food.id === entry.foodItemId);
    const nextNutrients = baseFood ? scaleNutrients(baseFood.nutrients, nextServings) : entry.nutrients;
    updateLogEntry(entryId, { ...updates, servings: nextServings, nutrients: nextNutrients });
  };

  const handleDropToMeal = (mealId: string) => {
    if (!draggedEntryId) return;
    handleUpdateEntry(draggedEntryId, { mealType: mealId as MealType });
    setDraggedEntryId(null);
    setDragOverMeal(null);
  };

  const mlToGlasses = (ml: number) => (ml / 250).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Daily Food Log</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date navigator — z-10 so native date picker renders above meal cards */}
          <div className="relative z-10 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => shiftDate(-1)}
              className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Previous day"
            >
              ←
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm text-slate-800 focus:ring-0 dark:text-slate-200"
            />
            <button
              onClick={goToToday}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Today
            </button>
            <button
              onClick={() => shiftDate(1)}
              className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Next day"
            >
              →
            </button>
          </div>
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
              foods={foods}
              isDragOver={dragOverMeal === meal.id}
              onDragStartCard={setDraggedEntryId}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={removeLogEntry}
            />
          </div>
        ))}
      </div>

      {/* Water Tracker */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Water Intake</h3>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {totalWaterMl} ml
            <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">
              / {waterGoal} ml ({mlToGlasses(totalWaterMl)} / {mlToGlasses(waterGoal)} glasses)
            </span>
          </span>
        </div>

        <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-sky-400 transition-all duration-300"
            style={{ width: `${waterPct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {WATER_PRESETS.map((ml) => (
            <button
              key={ml}
              onClick={() => addWater(selectedDate, ml)}
              className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
            >
              +{ml} ml
            </button>
          ))}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={10}
              max={2000}
              step={10}
              value={customWaterStr}
              onChange={(e) => setCustomWaterStr(e.target.value)}
              className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-600"
              aria-label="Custom amount in ml"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">ml</span>
            <button
              onClick={() => { if (customWaterMl > 0) addWater(selectedDate, customWaterMl); }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Add
            </button>
          </div>
        </div>

        {todayWaterEntries.length > 0 ? (
          <div className="mt-3 space-y-1">
            {todayWaterEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-800">
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  {entry.amount} ml
                  <span className="ml-2 text-slate-400 dark:text-slate-500">
                    {new Date(entry.loggedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
                <button
                  onClick={() => removeWater(entry.id)}
                  className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                  aria-label="Remove water entry"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
