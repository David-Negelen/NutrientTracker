import { FoodItem } from "@/types/nutrition";
import { FoodSearchResult } from "@/api/usda";

const OFF_BASE = "https://world.openfoodfacts.org/api/v2/product";
const OFF_SEARCH_BASE = "https://world.openfoodfacts.org/cgi/search.pl";

const mapOpenFoodFactsProductToFoodItem = (product: any, fallbackId?: string): FoodItem => ({
  id: `off-${product.code || fallbackId || product.id || Math.random().toString(36).slice(2, 10)}`,
  name: product.product_name || "Unknown Product",
  brand: product.brands || undefined,
  servingSize: Number(product.serving_quantity || 100),
  servingUnit: product.serving_quantity_unit || "g",
  barcode: product.code || undefined,
  source: "openfoodfacts",
  nutrients: {
    calories: Number(product.nutriments?.["energy-kcal_100g"] || 0),
    protein: Number(product.nutriments?.proteins_100g || 0),
    carbs: Number(product.nutriments?.carbohydrates_100g || 0),
    fat: Number(product.nutriments?.fat_100g || 0),
    fiber: Number(product.nutriments?.fiber_100g || 0),
    sugar: Number(product.nutriments?.sugars_100g || 0),
    sodium: Number(product.nutriments?.sodium_100g || 0),
    vitaminA: 0,
    vitaminC: 0,
    calcium: 0,
    iron: 0
  }
});

export async function fetchOpenFoodFactsByBarcode(barcode: string): Promise<FoodItem | null> {
  const response = await fetch(`${OFF_BASE}/${barcode}.json`);
  if (!response.ok) {
    throw new Error("Unable to fetch barcode item from OpenFoodFacts.");
  }

  const payload = await response.json();
  const product = payload?.product;
  if (!product) return null;

  return mapOpenFoodFactsProductToFoodItem(product, barcode);
}

export async function searchOpenFoodFactsFoods(query: string): Promise<FoodSearchResult[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "12"
  });

  const response = await fetch(`${OFF_SEARCH_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Unable to search OpenFoodFacts.");
  }

  const payload = await response.json();
  const products = payload?.products ?? [];

  return products
    .filter((product: any) => product?.product_name)
    .map((product: any) => {
      const item = mapOpenFoodFactsProductToFoodItem(product);
      return {
        id: item.id,
        label: item.name,
        subtitle: item.brand || "OpenFoodFacts",
        item
      };
    });
}