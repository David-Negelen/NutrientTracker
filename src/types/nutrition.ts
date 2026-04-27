export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface NutrientValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  /** Estimated added sugar (total sugar minus estimated natural lactose). Set for detected dairy products. */
  addedSugar?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  nutrients: NutrientValues;
  source: "openfoodfacts" | "usda" | "custom";
  barcode?: string;
  mealComposition?: MealCompositionItem[];
}

export interface MealCompositionItem {
  food: FoodItem;
  grams: number;
}

export interface LogEntry {
  id: string;
  foodItemId: string;
  foodName: string;
  consumedAt: string;
  mealType: MealType;
  servings: number;
  nutrients: NutrientValues;
}

export interface WaterEntry {
  id: string;
  dateIso: string;
  amount: number;
  loggedAt: string;
}

export interface NutrientGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface UserProfile {
  age?: number;
  weightKg?: number;
  heightCm?: number;
  activityLevel?: "low" | "moderate" | "high";
  waterGoalMl?: number;
}

export const emptyNutrients = (): NutrientValues => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0
});

export const scaleNutrients = (nutrients: NutrientValues, factor: number): NutrientValues => ({
  calories: nutrients.calories * factor,
  protein: nutrients.protein * factor,
  carbs: nutrients.carbs * factor,
  fat: nutrients.fat * factor,
  fiber: nutrients.fiber * factor,
  sugar: nutrients.sugar * factor,
  addedSugar: nutrients.addedSugar !== undefined ? nutrients.addedSugar * factor : undefined
});

export const defaultGoals: NutrientGoals = {
  calories: 2200,
  protein: 120,
  carbs: 250,
  fat: 70,
  fiber: 30,
  sugar: 40
};

export const DEFAULT_WATER_GOAL_ML = 2000;
