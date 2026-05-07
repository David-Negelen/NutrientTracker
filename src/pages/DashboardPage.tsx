import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/common/Card";
import { CalorieRingChart } from "@/components/dashboard/CalorieRingChart";
import { NutrientBreakdownPanel } from "@/components/dashboard/NutrientBreakdownPanel";
import { NutrientProgressBar } from "@/components/dashboard/NutrientProgressBar";
import { TipsPanel } from "@/components/dashboard/TipsPanel";
import { WaterTracker } from "@/components/dashboard/WaterTracker";
import { WeeklyMacroTrend } from "@/components/dashboard/WeeklyMacroTrend";
import { useNutrientStore } from "@/store/useNutrientStore";
import type { NutrientValues } from "@/types/nutrition";

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
  const [selectedNutrientKey, setSelectedNutrientKey] = useState<keyof NutrientValues | null>(null);

  const calendarRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [panelMaxHeight, setPanelMaxHeight] = useState<number>(0);

  useLayoutEffect(() => {
    if (!selectedNutrientKey && progressRef.current) {
      setPanelMaxHeight(progressRef.current.offsetHeight);
    }
  }, [selectedNutrientKey]);

  const goals = useNutrientStore((state) => state.goals);
  const allEntries = useNutrientStore((state) => state.entries);
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
      { name: "Calories", nutrientKey: "calories" as keyof NutrientValues, current: totals.calories, goal: goals.calories * goalMultiplier, unit: "kcal", targetType: "limit" as const },
      { name: "Protein", nutrientKey: "protein" as keyof NutrientValues, current: totals.protein, goal: goals.protein * goalMultiplier, unit: "g", targetType: "goal" as const },
      { name: "Carbs", nutrientKey: "carbs" as keyof NutrientValues, current: totals.carbs, goal: goals.carbs * goalMultiplier, unit: "g", targetType: "goal" as const },
      { name: "Fat", nutrientKey: "fat" as keyof NutrientValues, current: totals.fat, goal: goals.fat * goalMultiplier, unit: "g", targetType: "limit" as const },
      { name: "Fiber", nutrientKey: "fiber" as keyof NutrientValues, current: totals.fiber, goal: goals.fiber * goalMultiplier, unit: "g", targetType: "goal" as const },
      { name: "Sugar", nutrientKey: "sugar" as keyof NutrientValues, current: totals.addedSugar ?? totals.sugar, goal: goals.sugar * goalMultiplier, unit: "g", targetType: "limit" as const }
    ],
    [goalMultiplier, goals, totals]
  );

  const activeEntries = useMemo(() => {
    if (viewMode === "daily") {
      const day = parseIsoDateLocal(activeDailyDateIso).toDateString();
      return allEntries.filter((entry) => new Date(entry.consumedAt).toDateString() === day);
    }
    const weekStart = parseIsoDateLocal(weekStartIso);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return allEntries.filter((entry) => {
      const consumed = new Date(entry.consumedAt);
      return consumed >= weekStart && consumed <= weekEnd;
    });
  }, [allEntries, viewMode, activeDailyDateIso, weekStartIso]);

  const selectedNutrientRow = selectedNutrientKey ? nutrientRows.find((r) => r.nutrientKey === selectedNutrientKey) : null;

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
    if (viewMode === "daily") return selectedDateIso !== todayIso;
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
    if (!isCalendarOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!calendarRef.current?.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isCalendarOpen]);

  const calendarDays = getMonthGrid(calendarMonth);

  return (
    <div className="space-y-6">
      <div className="fade-in-up relative z-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Nutrient Overview</h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date navigator + calendar */}
          <div className="relative" ref={calendarRef}>
            <div className="inline-flex items-center rounded-full bg-white p-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <button
                onClick={() => navigateByMode(-1)}
                className="rounded-full px-3 py-1.5 text-base font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label={viewMode === "daily" ? "Previous day" : "Previous week"}
              >
                ‹
              </button>

              <button
                onClick={() => {
                  setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                  setIsCalendarOpen((open) => !open);
                }}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="Open calendar"
              >
                {centerLabel}
              </button>

              <button
                onClick={() => navigateByMode(1)}
                className="rounded-full px-3 py-1.5 text-base font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label={viewMode === "daily" ? "Next day" : "Next week"}
              >
                ›
              </button>
            </div>

            {isCalendarOpen ? (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                <div className="mb-2 flex items-center justify-between">
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                    className="rounded px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    aria-label="Previous month"
                  >
                    ‹
                  </button>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </p>
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                    className="rounded px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    aria-label="Next month"
                  >
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                    <div key={day} className="py-1">{day}</div>
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
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : isCurrentMonth
                                ? "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                : "text-slate-400 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-700/50"
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
              className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              Today
            </button>
          ) : null}

          <div className="inline-flex items-center rounded-full bg-white p-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            {(["daily", "weekly"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  if (mode === "weekly") setHoveredTimelineDate(null);
                }}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  viewMode === mode
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
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

        <div className="fade-in-up flex gap-6 lg:col-span-2">
          <div ref={progressRef} className="min-w-0 flex-1">
            <Card title="Nutrient Progress" className="space-y-1">
              {nutrientRows.map((nutrient) => (
                <NutrientProgressBar
                  key={nutrient.name}
                  name={nutrient.name}
                  current={nutrient.current}
                  goal={nutrient.goal}
                  unit={nutrient.unit}
                  targetType={nutrient.targetType}
                  onClick={() => setSelectedNutrientKey((k) => (k === nutrient.nutrientKey ? null : nutrient.nutrientKey))}
                  isSelected={selectedNutrientKey === nutrient.nutrientKey}
                />
              ))}
            </Card>
          </div>

          {selectedNutrientRow ? (
            <Card
              title={`${selectedNutrientRow.name} Sources`}
              actions={
                <button
                  onClick={() => setSelectedNutrientKey(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  aria-label="Close breakdown"
                >
                  ✕
                </button>
              }
              className="w-72 shrink-0 flex flex-col"
              style={{ maxHeight: panelMaxHeight || undefined }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <NutrientBreakdownPanel
                  nutrientKey={selectedNutrientRow.nutrientKey}
                  unit={selectedNutrientRow.unit}
                  entries={activeEntries}
                />
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <Card title="Weekly Macro Trends (Monday–Sunday)" className="fade-in-up">
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

      <Card title="Water Intake" className="fade-in-up">
        <WaterTracker dateIso={activeDailyDateIso} />
      </Card>

      {viewMode === "daily" ? (
        <Card title="Improvement Tips" className="fade-in-up">
          <TipsPanel
            totals={dailyTotals}
            goals={goals}
            entries={activeEntries}
            dateIso={activeDailyDateIso}
          />
        </Card>
      ) : null}
    </div>
  );
}
