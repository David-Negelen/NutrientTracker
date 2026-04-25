import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/common/Card";
import { CalorieRingChart } from "@/components/dashboard/CalorieRingChart";
import { NutrientProgressBar } from "@/components/dashboard/NutrientProgressBar";
import { WeeklyMacroTrend } from "@/components/dashboard/WeeklyMacroTrend";
import { useNutrientStore } from "@/store/useNutrientStore";

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

const getMondayFromDate = (date: Date) => {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  return monday;
};

const getIsoWeekNumber = (date: Date) => {
  const reference = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = reference.getDay() || 7;
  reference.setDate(reference.getDate() + 4 - day);
  const yearStart = new Date(reference.getFullYear(), 0, 1);
  return Math.ceil(((reference.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isSameWeek = (a: Date, b: Date) =>
  getMondayFromDate(a).toDateString() === getMondayFromDate(b).toDateString();

const getMonthGrid = (monthDate: Date) => {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - leadingDays);

  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(start);
    cell.setDate(start.getDate() + index);
    return cell;
  });
};

export function DashboardPage() {
  const today = new Date();
  const todayIso = formatIsoDateLocal(today);

  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso);
  const [hoveredTimelineDate, setHoveredTimelineDate] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const calendarRef = useRef<HTMLDivElement | null>(null);

  const goals = useNutrientStore((state) => state.goals);
  const dailyTotalsForDate = useNutrientStore((state) => state.dailyTotals);
  const weeklyTotalsForDate = useNutrientStore((state) => state.weeklyTotals);
  const weeklySeriesForDate = useNutrientStore((state) => state.weeklyMacroSeries);

  const selectedDate = parseIsoDateLocal(selectedDateIso);
  const weekMonday = getMondayFromDate(selectedDate);
  const weekStartIso = formatIsoDateLocal(weekMonday);
  const weekEnd = new Date(weekMonday);
  weekEnd.setDate(weekMonday.getDate() + 6);

  const activeDailyDateIso = hoveredTimelineDate ?? selectedDateIso;
  const activeDailyDate = parseIsoDateLocal(activeDailyDateIso);

  const dailyTotals = dailyTotalsForDate(activeDailyDateIso);
  const weeklyTotals = weeklyTotalsForDate(weekStartIso);
  const weeklySeries = weeklySeriesForDate(weekStartIso);

  const totals = viewMode === "daily" ? dailyTotals : weeklyTotals;
  const goalMultiplier = viewMode === "weekly" ? 7 : 1;

  const nutrientRows = useMemo(
    () => [
      { name: "Calories", current: totals.calories, goal: goals.calories * goalMultiplier, unit: "kcal", targetType: "limit" as const },
      { name: "Protein", current: totals.protein, goal: goals.protein * goalMultiplier, unit: "g", targetType: "goal" as const },
      { name: "Carbs", current: totals.carbs, goal: goals.carbs * goalMultiplier, unit: "g", targetType: "goal" as const },
      { name: "Fat", current: totals.fat, goal: goals.fat * goalMultiplier, unit: "g", targetType: "limit" as const },
      { name: "Fiber", current: totals.fiber, goal: goals.fiber * goalMultiplier, unit: "g", targetType: "goal" as const },
      { name: "Sugar", current: totals.sugar, goal: goals.sugar * goalMultiplier, unit: "g", targetType: "limit" as const }
    ],
    [goalMultiplier, goals, totals]
  );

  const dailyLabel = useMemo(() => {
    const weekday = activeDailyDate.toLocaleDateString(undefined, { weekday: "short" });
    const day = activeDailyDate.toLocaleDateString(undefined, { day: "2-digit" });
    const month = activeDailyDate.toLocaleDateString(undefined, { month: "short" });
    return `${weekday} ${day} ${month} · KW ${getIsoWeekNumber(activeDailyDate)}`;
  }, [activeDailyDate]);

  const weeklyLabel = useMemo(() => {
    const startDay = weekMonday.toLocaleDateString(undefined, { day: "numeric" });
    const endDay = weekEnd.toLocaleDateString(undefined, { day: "numeric" });
    const startMonth = weekMonday.toLocaleDateString(undefined, { month: "short" });
    const endMonth = weekEnd.toLocaleDateString(undefined, { month: "short" });
    const datePart = startMonth === endMonth ? `${startDay}–${endDay} ${endMonth}` : `${startDay} ${startMonth}–${endDay} ${endMonth}`;
    return `${datePart} · KW ${getIsoWeekNumber(weekMonday)}`;
  }, [weekMonday, weekEnd]);

  const centerLabel = viewMode === "daily" ? dailyLabel : weeklyLabel;

  const shouldShowToday = useMemo(() => {
    if (viewMode === "daily") {
      return selectedDateIso !== todayIso;
    }
    return !isSameWeek(selectedDate, today);
  }, [selectedDate, selectedDateIso, today, todayIso, viewMode]);

  const navigateByMode = (direction: -1 | 1) => {
    const base = parseIsoDateLocal(selectedDateIso);
    const step = viewMode === "daily" ? 1 : 7;
    base.setDate(base.getDate() + direction * step);
    setSelectedDateIso(formatIsoDateLocal(base));
    setHoveredTimelineDate(null);
  };

  const jumpToToday = () => {
    setSelectedDateIso(todayIso);
    setHoveredTimelineDate(null);
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handlePickDate = (date: Date) => {
    setSelectedDateIso(formatIsoDateLocal(date));
    setHoveredTimelineDate(null);
    setIsCalendarOpen(false);
  };

  useEffect(() => {
    if (!isCalendarOpen) {
      return;
    }

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!calendarRef.current?.contains(target)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isCalendarOpen]);

  const calendarDays = getMonthGrid(calendarMonth);

  return (
    <div className="space-y-6">
      <div className="fade-in-up flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Nutrient Overview</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="relative inline-flex items-center rounded-full bg-white p-1"
            style={{ border: "0.5px solid rgb(226 232 240)" }}
            ref={calendarRef}
          >
            <button
              onClick={() => navigateByMode(-1)}
              className="rounded-full px-3 py-1.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
              aria-label={viewMode === "daily" ? "Previous day" : "Previous week"}
            >
              ‹
            </button>

            <button
              onClick={() => {
                setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                setIsCalendarOpen((open) => !open);
              }}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              aria-label="Open calendar"
            >
              {centerLabel}
            </button>

            <button
              onClick={() => navigateByMode(1)}
              className="rounded-full px-3 py-1.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
              aria-label={viewMode === "daily" ? "Next day" : "Next week"}
            >
              ›
            </button>

            {isCalendarOpen ? (
              <div
                className="absolute right-0 top-12 z-20 w-72 rounded-2xl bg-white p-3 shadow-lg"
                style={{ border: "0.5px solid rgb(226 232 240)" }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                    className="rounded px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    aria-label="Previous month"
                  >
                    ‹
                  </button>
                  <p className="text-sm font-semibold text-slate-800">
                    {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </p>
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                    className="rounded px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    aria-label="Next month"
                  >
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                    <div key={day} className="py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date) => {
                    const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, today);

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handlePickDate(date)}
                        className={[
                          "rounded-md py-1.5 text-xs font-medium",
                          isSelected
                            ? "bg-brand-600 text-white"
                            : isToday
                              ? "bg-emerald-100 text-emerald-700"
                              : isCurrentMonth
                                ? "text-slate-700 hover:bg-slate-100"
                                : "text-slate-400 hover:bg-slate-50"
                        ].join(" ")}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {shouldShowToday ? (
            <button
              onClick={jumpToToday}
              className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              style={{ border: "0.5px solid rgb(226 232 240)" }}
            >
              Today
            </button>
          ) : null}

          <div
            className="inline-flex items-center rounded-full bg-white p-1"
            style={{ border: "0.5px solid rgb(226 232 240)" }}
          >
            {(["daily", "weekly"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  if (mode === "weekly") {
                    setHoveredTimelineDate(null);
                  }
                }}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  viewMode === mode ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
                ].join(" ")}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={viewMode === "daily" ? "Calorie Ring" : "Weekly Calorie Ring"} className="fade-in-up lg:col-span-1">
          <CalorieRingChart consumed={totals.calories} goal={goals.calories * goalMultiplier} />
        </Card>

        <Card title="Nutrient Progress" className="fade-in-up space-y-4 lg:col-span-2">
          {nutrientRows.map((nutrient) => (
            <NutrientProgressBar
              key={nutrient.name}
              name={nutrient.name}
              current={nutrient.current}
              goal={nutrient.goal}
              unit={nutrient.unit}
              targetType={nutrient.targetType}
            />
          ))}
        </Card>
      </div>

      <Card title="Weekly Macro Trends (Monday-Sunday)" className="fade-in-up">
        <WeeklyMacroTrend
          data={weeklySeries}
          onHoverDate={viewMode === "daily" ? setHoveredTimelineDate : undefined}
          onSelectDate={
            viewMode === "daily"
              ? (dateIso) => {
                  setSelectedDateIso(dateIso);
                  setHoveredTimelineDate(dateIso);
                }
              : undefined
          }
        />
      </Card>
    </div>
  );
}
