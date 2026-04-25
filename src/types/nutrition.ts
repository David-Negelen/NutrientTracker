export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface NutrientValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitaminA: number;
  vitaminC: number;
  calcium: number;
  iron: number;
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

export interface NutrientGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitaminA: number;
  vitaminC: number;
  calcium: number;
  iron: number;
}

export interface UserProfile {
  age?: number;
  weightKg?: number;
  heightCm?: number;
  activityLevel?: "low" | "moderate" | "high";
}

export const emptyNutrients = (): NutrientValues => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  vitaminA: 0,
  vitaminC: 0,
  calcium: 0,
  iron: 0
});

export const scaleNutrients = (nutrients: NutrientValues, factor: number): NutrientValues => ({
  calories: nutrients.calories * factor,
  protein: nutrients.protein * factor,
  carbs: nutrients.carbs * factor,
  fat: nutrients.fat * factor,
  fiber: nutrients.fiber * factor,
  sugar: nutrients.sugar * factor,
  sodium: nutrients.sodium * factor,
  vitaminA: nutrients.vitaminA * factor,
  vitaminC: nutrients.vitaminC * factor,
  calcium: nutrients.calcium * factor,
  iron: nutrients.iron * factor
});

export const defaultGoals: NutrientGoals = {
  calories: 2200,
  protein: 120,
  carbs: 250,
  fat: 70,
  fiber: 30,
  sugar: 40,
  sodium: 2300,
  vitaminA: 900,
  vitaminC: 90,
  calcium: 1000,
  iron: 18
};