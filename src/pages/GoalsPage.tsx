import { ChangeEvent } from "react";
import { Card } from "@/components/common/Card";
import { DEFAULT_WATER_GOAL_ML, NutrientGoals, UserProfile } from "@/types/nutrition";
import { useNutrientStore } from "@/store/useNutrientStore";

const goalFields: Array<{ key: keyof NutrientGoals; label: string; unit: string }> = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugar", label: "Sugar (added)", unit: "g" },
];

const profileFields: Array<{ key: keyof UserProfile; label: string }> = [
  { key: "age", label: "Age" },
  { key: "weightKg", label: "Weight (kg)" },
  { key: "heightCm", label: "Height (cm)" }
];

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

export function GoalsPage() {
  const goals = useNutrientStore((state) => state.goals);
  const profile = useNutrientStore((state) => state.profile);
  const updateGoals = useNutrientStore((state) => state.updateGoals);
  const updateProfile = useNutrientStore((state) => state.updateProfile);

  const onGoalChange = (key: keyof NutrientGoals) => (event: ChangeEvent<HTMLInputElement>) => {
    updateGoals({ [key]: Number(event.target.value) } as Partial<NutrientGoals>);
  };

  const onProfileChange = (key: keyof UserProfile) => (event: ChangeEvent<HTMLInputElement>) => {
    updateProfile({ [key]: Number(event.target.value) } as Partial<UserProfile>);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Goals &amp; Profile</h2>

      <Card title="Nutrient Goals">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {goalFields.map((field) => (
            <label key={field.key} className="text-sm text-slate-600 dark:text-slate-400">
              <span className="mb-1.5 block font-medium">
                {field.label} <span className="font-normal text-slate-400 dark:text-slate-500">({field.unit})</span>
              </span>
              <input
                type="number"
                min={0}
                value={goals[field.key] || ""}
                onChange={onGoalChange(field.key)}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      </Card>

      <Card title="Profile Settings">
        <div className="grid gap-3 md:grid-cols-3">
          {profileFields.map((field) => (
            <label key={field.key} className="text-sm text-slate-600 dark:text-slate-400">
              <span className="mb-1.5 block font-medium">{field.label}</span>
              <input
                type="number"
                min={0}
                value={profile[field.key] ?? ""}
                onChange={onProfileChange(field.key)}
                className={inputClass}
              />
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-600 dark:text-slate-400">
            <span className="mb-1.5 block font-medium">Activity Level</span>
            <select
              value={profile.activityLevel ?? "moderate"}
              onChange={(event) =>
                updateProfile({ activityLevel: event.target.value as "low" | "moderate" | "high" })
              }
              className={inputClass}
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="text-sm text-slate-600 dark:text-slate-400">
            <span className="mb-1.5 block font-medium">Daily Water Goal (ml)</span>
            <input
              type="number"
              min={500}
              max={6000}
              step={100}
              value={profile.waterGoalMl ?? DEFAULT_WATER_GOAL_ML}
              onChange={(e) => updateProfile({ waterGoalMl: Number(e.target.value) })}
              className={inputClass}
            />
          </label>
        </div>
      </Card>
    </div>
  );
}
