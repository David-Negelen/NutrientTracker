import { FoodItem } from "@/types/nutrition";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY;

export interface FoodSearchResult {
  id: string;
  label: string;
  subtitle?: string;
  item: FoodItem;
}

const nutrientValue = (
  nutrients: Array<{ nutrientName: string; value: number }> | undefined,
  names: string[]
): number => {
  const match = nutrients?.find((n) => names.includes(n.nutrientName));
  return Number(match?.value ?? 0);
};

export async function searchUsdaFoods(query: string): Promise<FoodSearchResult[]> {
  if (!USDA_API_KEY) {
    return [];
  }

  const url = `${USDA_BASE}?api_key=${USDA_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, pageSize: 8 })
  });

  if (!response.ok) {
    throw new Error("Unable to search USDA FoodData Central.");
  }

  const payload = await response.json();
  const foods = payload?.foods ?? [];

  return foods.map((food: any) => {
    const nutrients = food.foodNutrients ?? [];
    const item: FoodItem = {
      id: `usda-${food.fdcId}`,
      name: food.description,
      brand: food.brandOwner,
      servingSize: 100,
      servingUnit: "g",
      source: "usda",
      nutrients: {
        calories: nutrientValue(nutrients, ["Energy"]),
        protein: nutrientValue(nutrients, ["Protein"]),
        carbs: nutrientValue(nutrients, ["Carbohydrate, by difference"]),
        fat: nutrientValue(nutrients, ["Total lipid (fat)"]),
        fiber: nutrientValue(nutrients, ["Fiber, total dietary"]),
        sugar: nutrientValue(nutrients, ["Sugars, total including NLEA"]),
        sodium: nutrientValue(nutrients, ["Sodium, Na"]),
        vitaminA: nutrientValue(nutrients, ["Vitamin A, RAE"]),
        vitaminC: nutrientValue(nutrients, ["Vitamin C, total ascorbic acid"]),
        calcium: nutrientValue(nutrients, ["Calcium, Ca"]),
        iron: nutrientValue(nutrients, ["Iron, Fe"])
      }
    };

    return {
      id: item.id,
      label: item.name,
      subtitle: item.brand,
      item
    };
  });
}