interface NutrientProgressBarProps {
  name: string;
  current: number;
  goal: number;
  unit?: string;
  targetType?: "goal" | "limit";
}

const statusColor = (ratio: number, targetType: "goal" | "limit") => {
  if (targetType === "limit") {
    if (ratio <= 0.8) return "bg-emerald-500";
    if (ratio <= 1.0) return "bg-amber-500";
    return "bg-rose-500";
  }

  if (ratio < 0.6) return "bg-sky-500";
  if (ratio < 1.0) return "bg-brand-600";
  return "bg-emerald-500";
};

export function NutrientProgressBar({ name, current, goal, unit = "g", targetType = "goal" }: NutrientProgressBarProps) {
  const ratio = goal > 0 ? current / goal : 0;
  const fill = Math.min(ratio * 100, 100);
  const targetLabel = targetType === "limit" ? "limit" : "goal";

  return (
    <div className="group space-y-1 rounded-lg px-2 py-2 transition-all duration-300 hover:bg-slate-50">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-slate-700">{name}</p>
        <p className="text-xs text-slate-500">
          {current.toFixed(1)} / {goal.toFixed(1)} {unit} {targetLabel}
        </p>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${statusColor(ratio, targetType)}`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}