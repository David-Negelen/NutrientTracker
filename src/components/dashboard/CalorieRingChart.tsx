import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts";

interface CalorieRingChartProps {
  consumed: number;
  goal: number;
}

export function CalorieRingChart({ consumed, goal }: CalorieRingChartProps) {
  const safeGoal = Math.max(goal, 1);
  const boundedConsumed = Math.min(consumed, safeGoal);
  const remaining = Math.max(safeGoal - boundedConsumed, 0);

  const data = [
    { name: "Consumed", value: boundedConsumed },
    { name: "Remaining", value: remaining }
  ];

  return (
    <div className="relative h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={72}
            outerRadius={100}
            dataKey="value"
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            <Cell fill="#11a86f" />
            <Cell fill="#dbe3e8" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{Math.round(consumed)}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">of {goal} kcal</p>
        </div>
      </div>
    </div>
  );
}
