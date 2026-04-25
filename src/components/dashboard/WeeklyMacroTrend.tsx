import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface WeeklyMacroPoint {
  day: string;
  dateIso: string;
  protein: number;
  carbs: number;
  fat: number;
}

interface WeeklyMacroTrendProps {
  data: WeeklyMacroPoint[];
  onHoverDate?: (dateIso: string | null) => void;
  onSelectDate?: (dateIso: string) => void;
}

export function WeeklyMacroTrend({ data, onHoverDate, onSelectDate }: WeeklyMacroTrendProps) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
          onMouseMove={(state) => {
            const point = state?.activePayload?.[0]?.payload as WeeklyMacroPoint | undefined;
            onHoverDate?.(point?.dateIso ?? null);
          }}
          onMouseLeave={() => onHoverDate?.(null)}
          onClick={(state) => {
            const point = state?.activePayload?.[0]?.payload as WeeklyMacroPoint | undefined;
            if (point?.dateIso) {
              onSelectDate?.(point.dateIso);
            }
          }}
        >
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="protein" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="carbs" stroke="#10b981" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="fat" stroke="#f97316" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}