import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultGoals, emptyNutrients, FoodItem, LogEntry, NutrientGoals, NutrientValues, UserProfile } from "@/types/nutrition";

interface NutrientState {
  foods: FoodItem[];
  entries: LogEntry[];
  favorites: string[];
  recentFoodIds: string[];
  goals: NutrientGoals;
  profile: UserProfile;
  addFood: (food: FoodItem) => void;
  updateFood: (food: FoodItem) => void;
  deleteFood: (foodId: string) => void;
  addLogEntry: (entry: LogEntry) => void;
  updateLogEntry: (entryId: string, updates: Partial<Pick<LogEntry, "servings" | "mealType" | "consumedAt" | "nutrients">>) => void;
  removeLogEntry: (entryId: string) => void;
  toggleFavorite: (foodId: string) => void;
  clearRecent: () => void;
  updateGoals: (goals: Partial<NutrientGoals>) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  dailyTotals: (dateIso?: string) => NutrientValues;
  weeklyTotals: (dateIso?: string) => NutrientValues;
  weeklyMacroSeries: (dateIso?: string) => Array<{ day: string; dateIso: string; protein: number; carbs: number; fat: number }>;
}

const sumNutrients = (acc: NutrientValues, next: NutrientValues): NutrientValues => ({
  calories: acc.calories + next.calories,
  protein: acc.protein + next.protein,
  carbs: acc.carbs + next.carbs,
  fat: acc.fat + next.fat,
  fiber: acc.fiber + next.fiber,
  sugar: acc.sugar + next.sugar,
  sodium: acc.sodium + next.sodium,
  vitaminA: acc.vitaminA + next.vitaminA,
  vitaminC: acc.vitaminC + next.vitaminC,
  calcium: acc.calcium + next.calcium,
  iron: acc.iron + next.iron
});

const parseIsoDateLocal = (dateIso: string) => {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatIsoDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfWeekMonday = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
};

export const useNutrientStore = create<NutrientState>()(
  persist(
    (set, get) => ({
      foods: [],
      entries: [],
      favorites: [],
      recentFoodIds: [],
      goals: defaultGoals,
      profile: { activityLevel: "moderate" },
      addFood: (food) =>
        set((state) => {
          const exists = state.foods.some((item) => item.id === food.id);
          return {
            foods: exists ? state.foods : [food, ...state.foods]
          };
        }),
      updateFood: (food) =>
        set((state) => ({
          foods: state.foods.map((item) => (item.id === food.id ? food : item))
        })),
      deleteFood: (foodId) =>
        set((state) => ({
          foods: state.foods.filter((item) => item.id !== foodId),
          favorites: state.favorites.filter((id) => id !== foodId),
          recentFoodIds: state.recentFoodIds.filter((id) => id !== foodId)
        })),
      addLogEntry: (entry) =>
        set((state) => ({
          entries: [entry, ...state.entries],
          recentFoodIds: [entry.foodItemId, ...state.recentFoodIds.filter((id) => id !== entry.foodItemId)].slice(0, 8)
        })),
      updateLogEntry: (entryId, updates) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  ...updates
                }
              : entry
          )
        })),
      removeLogEntry: (entryId) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== entryId)
        })),
      toggleFavorite: (foodId) =>
        set((state) => ({
          favorites: state.favorites.includes(foodId)
            ? state.favorites.filter((id) => id !== foodId)
            : [...state.favorites, foodId]
        })),
      clearRecent: () =>
        set(() => ({
          recentFoodIds: []
        })),
      updateGoals: (goals) => set((state) => ({ goals: { ...state.goals, ...goals } })),
      updateProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),
      dailyTotals: (dateIso) => {
        const targetDate = dateIso ? parseIsoDateLocal(dateIso) : new Date();
        const day = targetDate.toDateString();
        return get()
          .entries.filter((entry) => new Date(entry.consumedAt).toDateString() === day)
          .reduce((acc, entry) => sumNutrients(acc, entry.nutrients), emptyNutrients());
      },
      weeklyTotals: (dateIso) => {
        const anchor = dateIso ? parseIsoDateLocal(dateIso) : new Date();
        const weekStart = startOfWeekMonday(anchor);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return get()
          .entries.filter((entry) => {
            const consumed = new Date(entry.consumedAt);
            return consumed >= weekStart && consumed <= weekEnd;
          })
          .reduce((acc, entry) => sumNutrients(acc, entry.nutrients), emptyNutrients());
      },
      weeklyMacroSeries: (dateIso) => {
        const anchor = dateIso ? parseIsoDateLocal(dateIso) : new Date();
        const weekStart = startOfWeekMonday(anchor);
        const days = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + index);
          return date;
        });

        return days.map((date) => {
          const dayLabel = date.toLocaleDateString(undefined, { weekday: "short" });
          const totals = get()
            .entries.filter((entry) => new Date(entry.consumedAt).toDateString() === date.toDateString())
            .reduce((acc, entry) => sumNutrients(acc, entry.nutrients), emptyNutrients());

          return {
            day: dayLabel,
            dateIso: formatIsoDateLocal(date),
            protein: totals.protein,
            carbs: totals.carbs,
            fat: totals.fat
          };
        });
      }
    }),
    {
      name: "nutrient-tracker-store",
      version: 2,
      migrate: (persistedState: any) => {
        const state = persistedState ?? {};
        return {
          ...state,
          foods: Array.isArray(state.foods) ? state.foods : [],
          entries: Array.isArray(state.entries) ? state.entries : [],
          favorites: Array.isArray(state.favorites) ? state.favorites : [],
          recentFoodIds: Array.isArray(state.recentFoodIds) ? state.recentFoodIds : [],
          goals: state.goals ?? defaultGoals,
          profile: state.profile ?? { activityLevel: "moderate" }
        };
      },
      partialize: (state) => ({
        foods: state.foods,
        entries: state.entries,
        favorites: state.favorites,
        recentFoodIds: state.recentFoodIds,
        goals: state.goals,
        profile: state.profile
      })
    }
  )
);