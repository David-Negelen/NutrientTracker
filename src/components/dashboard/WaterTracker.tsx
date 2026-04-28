import { useState } from "react";
import { useNutrientStore } from "@/store/useNutrientStore";
import { DEFAULT_WATER_GOAL_ML } from "@/types/nutrition";

const QUICK_AMOUNTS = [150, 250, 330, 500, 750, 1000];

interface WaterTrackerProps {
  dateIso: string;
}

const formatAmount = (ml: number) =>
  ml >= 1000 ? `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L` : `${ml} ml`;

const formatTime = (isoString: string) =>
  new Date(isoString).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function WaterTracker({ dateIso }: WaterTrackerProps) {
  const [customAmountStr, setCustomAmountStr] = useState("");

  const addWater = useNutrientStore((s) => s.addWater);
  const removeWater = useNutrientStore((s) => s.removeWater);
  const waterEntries = useNutrientStore((s) => s.waterEntries);
  const profile = useNutrientStore((s) => s.profile);

  const goal = profile.waterGoalMl ?? DEFAULT_WATER_GOAL_ML;
  const todayEntries = waterEntries
    .filter((e) => e.dateIso === dateIso)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const total = todayEntries.reduce((sum, e) => sum + e.amount, 0);
  const pct = Math.min((total / goal) * 100, 100);
  const ratio = goal > 0 ? total / goal : 0;
  const barColor = ratio >= 1 ? "bg-emerald-500" : ratio >= 0.5 ? "bg-sky-500" : "bg-sky-400";

  const submitCustom = () => {
    const amount = Math.round(parseFloat(customAmountStr));
    if (!amount || amount <= 0) return;
    addWater(dateIso, amount);
    setCustomAmountStr("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{formatAmount(total)}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {Math.round(pct)}% · goal {formatAmount(goal)}
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => addWater(dateIso, amount)}
            className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
          >
            +{formatAmount(amount)}
          </button>
        ))}

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            step={10}
            value={customAmountStr}
            onChange={(e) => setCustomAmountStr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCustom()}
            placeholder="ml"
            className="w-20 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500"
          />
          <button
            onClick={submitCustom}
            disabled={!customAmountStr || parseFloat(customAmountStr) <= 0}
            className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-40 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
          >
            + Add
          </button>
        </div>
      </div>

      {todayEntries.length > 0 ? (
        <div className="space-y-0.5">
          {todayEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <span className="text-sm">
                <span className="tabular-nums text-slate-400 dark:text-slate-500">{formatTime(entry.loggedAt)}</span>
                <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatAmount(entry.amount)}</span>
              </span>
              <button
                onClick={() => removeWater(entry.id)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label="Remove entry"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500">No water logged yet.</p>
      )}
    </div>
  );
}
