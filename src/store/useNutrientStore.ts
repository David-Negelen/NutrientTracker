import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore as createIDBStore, del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import {
  DEFAULT_WATER_GOAL_ML,
  defaultGoals,
  emptyNutrients,
  FoodItem,
  LogEntry,
  NutrientGoals,
  NutrientValues,
  UserProfile,
  WaterEntry
} from "@/types/nutrition";

const idbCustomStore = createIDBStore("nutrient-tracker-db", "kv");

const idbStorageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    const val = await idbGet<string>(name, idbCustomStore);
    if (val !== undefined) return val ?? null;
    // One-time migration from localStorage
    const lsVal = localStorage.getItem(name);
    if (lsVal !== null) {
      await idbSet(name, lsVal, idbCustomStore);
      localStorage.removeItem(name);
      return lsVal;
    }
    return null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value, idbCustomStore);
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name, idbCustomStore);
  }
};

interface NutrientState {
  foods: FoodItem[];
  entries: LogEntry[];
  waterEntries: WaterEntry[];
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
  touchRecent: (foodId: string) => void;
  clearRecent: () => void;
  updateGoals: (goals: Partial<NutrientGoals>) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addWater: (dateIso: string, amount: number) => void;
  removeWater: (id: string) => void;
  copyDay: (fromDateIso: string, toDateIso: string) => number;
  dailyTotals: (dateIso?: string) => NutrientValues;
  weeklyTotals: (dateIso?: string) => NutrientValues;
  weeklyMacroSeries: (dateIso?: string) => Array<{ day: string; dateIso: string; protein: number; carbs: number; fat: number }>;
  dailyWater: (dateIso?: string) => number;
}

const sumNutrients = (acc: NutrientValues, next: NutrientValues): NutrientValues => ({
  calories: acc.calories + next.calories,
  protein: acc.protein + next.protein,
  carbs: acc.carbs + next.carbs,
  fat: acc.fat + next.fat,
  fiber: acc.fiber + next.fiber,
  sugar: acc.sugar + next.sugar,
  addedSugar:
    acc.addedSugar !== undefined || next.addedSugar !== undefined
      ? (acc.addedSugar ?? acc.sugar) + (next.addedSugar ?? next.sugar)
      : undefined
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
      waterEntries: [],
      favorites: [],
      recentFoodIds: [],
      goals: defaultGoals,
      profile: { activityLevel: "moderate", waterGoalMl: DEFAULT_WATER_GOAL_ML },

      addFood: (food) =>
        set((state) => ({
          foods: state.foods.some((item) => item.id === food.id) ? state.foods : [food, ...state.foods]
        })),

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
          recentFoodIds: [entry.foodItemId, ...state.recentFoodIds.filter((id) => id !== entry.foodItemId)].slice(0, 12)
        })),

      updateLogEntry: (entryId, updates) =>
        set((state) => ({
          entries: state.entries.map((entry) => (entry.id === entryId ? { ...entry, ...updates } : entry))
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

      touchRecent: (foodId) =>
        set((state) => ({
          recentFoodIds: [foodId, ...state.recentFoodIds.filter((id) => id !== foodId)].slice(0, 12)
        })),

      clearRecent: () => set(() => ({ recentFoodIds: [] })),

      updateGoals: (goals) => set((state) => ({ goals: { ...state.goals, ...goals } })),

      updateProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),

      addWater: (dateIso, amount) =>
        set((state) => ({
          waterEntries: [
            {
              id: `water-${Date.now()}`,
              dateIso,
              amount,
              loggedAt: new Date().toISOString()
            },
            ...state.waterEntries
          ]
        })),

      removeWater: (id) =>
        set((state) => ({
          waterEntries: state.waterEntries.filter((entry) => entry.id !== id)
        })),

      copyDay: (fromDateIso, toDateIso) => {
        const fromDate = parseIsoDateLocal(fromDateIso);
        const [ty, tm, td] = toDateIso.split("-").map(Number);
        const fromEntries = get().entries.filter(
          (entry) => new Date(entry.consumedAt).toDateString() === fromDate.toDateString()
        );
        if (fromEntries.length === 0) return 0;
        const now = Date.now();
        const newEntries = fromEntries.map((entry, i) => {
          const orig = new Date(entry.consumedAt);
          const target = new Date(ty, tm - 1, td, orig.getHours(), orig.getMinutes(), 0, 0);
          return { ...entry, id: `log-${now + i}`, consumedAt: target.toISOString() };
        });
        set((state) => ({ entries: [...newEntries, ...state.entries] }));
        return fromEntries.length;
      },

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
        return Array.from({ length: 7 }, (_, index) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + index);
          const dayLabel = date.toLocaleDateString(undefined, { weekday: "short" });
          const totals = get()
            .entries.filter((entry) => new Date(entry.consumedAt).toDateString() === date.toDateString())
            .reduce((acc, entry) => sumNutrients(acc, entry.nutrients), emptyNutrients());
          return { day: dayLabel, dateIso: formatIsoDateLocal(date), protein: totals.protein, carbs: totals.carbs, fat: totals.fat };
        });
      },

      dailyWater: (dateIso) => {
        const target = dateIso ?? formatIsoDateLocal(new Date());
        return get()
          .waterEntries.filter((entry) => entry.dateIso === target)
          .reduce((sum, entry) => sum + entry.amount, 0);
      }
    }),
    {
      name: "nutrient-tracker-store",
      version: 4,
      storage: createJSONStorage(() => idbStorageAdapter),
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState as Record<string, unknown>) ?? {};
        const base = {
          foods: Array.isArray(state.foods) ? state.foods : [],
          entries: Array.isArray(state.entries) ? state.entries : [],
          waterEntries: Array.isArray(state.waterEntries) ? state.waterEntries : [],
          favorites: Array.isArray(state.favorites) ? state.favorites : [],
          recentFoodIds: Array.isArray(state.recentFoodIds) ? state.recentFoodIds : [],
          goals: (state.goals as NutrientGoals) ?? defaultGoals,
          profile: (state.profile as UserProfile) ?? { activityLevel: "moderate", waterGoalMl: DEFAULT_WATER_GOAL_ML }
        };
        if (version < 3) {
          base.waterEntries = [];
          if (!base.profile.waterGoalMl) base.profile.waterGoalMl = DEFAULT_WATER_GOAL_ML;
        }
        if (version < 4) {
          // Backfill addedSugar for milk-based protein drinks that were missed by previous lactose estimation
          const dairyProteinPattern = /\b(protein shake|protein drink|high protein|eiweißdrink|eiweißshake|protein milk)\b/i;
          const updatedFoods = (base.foods as FoodItem[]).map((food) => {
            if (food.nutrients.addedSugar !== undefined) return food;
            if (dairyProteinPattern.test(`${food.name} ${food.brand ?? ""}`)) {
              const estimatedLactose = 4.0;
              return { ...food, nutrients: { ...food.nutrients, addedSugar: Math.max(0, food.nutrients.sugar - estimatedLactose) } };
            }
            return food;
          });
          const foodMap = new Map<string, FoodItem>(updatedFoods.map((f) => [f.id, f]));
          const updatedEntries = (base.entries as LogEntry[]).map((entry) => {
            if (entry.nutrients.addedSugar !== undefined) return entry;
            const food = foodMap.get(entry.foodItemId);
            if (!food || food.nutrients.addedSugar === undefined) return entry;
            const fraction = food.nutrients.sugar > 0 ? food.nutrients.addedSugar / food.nutrients.sugar : 0;
            return { ...entry, nutrients: { ...entry.nutrients, addedSugar: entry.nutrients.sugar * fraction } };
          });
          base.foods = updatedFoods;
          base.entries = updatedEntries;
        }
        return base;
      },
      partialize: (state) => ({
        foods: state.foods,
        entries: state.entries,
        waterEntries: state.waterEntries,
        favorites: state.favorites,
        recentFoodIds: state.recentFoodIds,
        goals: state.goals,
        profile: state.profile
      })
    }
  )
);
