import { ChangeEvent } from "react";
import { Card } from "@/components/common/Card";
import { NutrientGoals, UserProfile } from "@/types/nutrition";
import { useNutrientStore } from "@/store/useNutrientStore";

const goalFields: Array<{ key: keyof NutrientGoals; label: string; unit: string }> = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "vitaminA", label: "Vitamin A", unit: "mcg" },
  { key: "vitaminC", label: "Vitamin C", unit: "mg" },
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" }
];

const profileFields: Array<{ key: keyof UserProfile; label: string }> = [
  { key: "age", label: "Age" },
  { key: "weightKg", label: "Weight (kg)" },
  { key: "heightCm", label: "Height (cm)" }
];

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
      <h2 className="text-xl font-bold text-slate-900">Goals & Profile</h2>

      <Card title="Nutrient Goals">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {goalFields.map((field) => (
            <label key={field.key} className="text-sm text-slate-600">
              <span className="mb-1 block">
                {field.label} ({field.unit})
              </span>
              <input
                type="number"
                value={goals[field.key] || ""}
                onChange={onGoalChange(field.key)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          ))}
        </div>
      </Card>

      <Card title="Profile Settings">
        <div className="grid gap-3 md:grid-cols-3">
          {profileFields.map((field) => (
            <label key={field.key} className="text-sm text-slate-600">
              <span className="mb-1 block">{field.label}</span>
              <input
                type="number"
                value={profile[field.key] ?? ""}
                onChange={onProfileChange(field.key)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-sm text-slate-600">
            <span className="mb-1 block">Activity Level</span>
            <select
              value={profile.activityLevel ?? "moderate"}
              onChange={(event) =>
                updateProfile({ activityLevel: event.target.value as "low" | "moderate" | "high" })
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 md:w-80"
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
      </Card>
    </div>
  );
}