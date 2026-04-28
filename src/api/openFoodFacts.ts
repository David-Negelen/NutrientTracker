import { FoodItem } from "@/types/nutrition";
import { FoodSearchResult } from "@/api/usda";

const OFF_BASE = "https://world.openfoodfacts.org/api/v2/product";
const OFF_SEARCH_BASE = "https://world.openfoodfacts.org/cgi/search.pl";

/**
 * Estimates natural lactose content (g per 100 g) based on the product name.
 * Returns null if the product is not recognisably dairy.
 *
 * Dairy products naturally contain lactose which is NOT added sugar.
 * Typical lactose levels per 100 g (approximate, varies by brand):
 *   Whole / skim milk   ~4.7 g
 *   Yogurt / Skyr       ~4.0 g
 *   Quark / Fromage     ~3.0 g
 *   Kefir               ~3.5 g
 *   Buttermilk          ~4.5 g
 *   Cream / sour cream  ~3.5 g
 *   Hard cheese         ~0.0 g (lactose essentially absent)
 */
function estimateLactoseG(name: string, brand?: string): number | null {
  const text = `${name} ${brand ?? ""}`.toLowerCase();

  // Hard/semi-hard cheeses have negligible lactose — skip estimation
  if (/\b(käse|cheese|gouda|emmental|parmesan|cheddar|brie|camembert|mozzarella|feta|halloumi|gruyère|gruyere)\b/.test(text)) {
    return null;
  }

  // Plant-based milks contain no lactose
  if (/\b(oat|hafer|soy|soja|soya|almond|mandel|rice|reis|coconut|kokos|hemp|hanf)\b.*\b(milk|milch|drink|drink)\b/.test(text)) {
    return null;
  }

  if (/\b(quark|magerquark|speisequark|fromage frais|skyr|hüttenkäse|cottage)\b/.test(text)) return 3.0;
  if (/\b(joghurt|yogurt|yoghurt|jghrt)\b/.test(text)) return 4.0;
  if (/\b(kefir)\b/.test(text)) return 3.5;
  if (/\b(buttermilch|buttermilk)\b/.test(text)) return 4.5;
  if (/\b(sahne|schlagsahne|cream|crème fraîche|creme fraiche|soured cream|sour cream|schmand|crema)\b/.test(text)) return 3.5;
  // Milk-based protein drinks / shakes (whey or casein based) — lactose ~4 g/100 ml
  if (/\b(protein shake|protein drink|high protein|eiweißdrink|eiweißshake|protein milk)\b/.test(text)) return 4.0;
  if (/\b(milch|milk|latte|leche)\b/.test(text)) return 4.7;

  return null;
}

const mapOpenFoodFactsProductToFoodItem = (product: any, fallbackId?: string): FoodItem => {
  const name: string = product.product_name || "Unknown Product";
  const brand: string | undefined = product.brands || undefined;
  const sugarPer100g = Number(product.nutriments?.sugars_100g || 0);

  const estimatedLactose = estimateLactoseG(name, brand);
  const addedSugar =
    estimatedLactose !== null
      ? Math.max(0, sugarPer100g - estimatedLactose)
      : undefined;

  return {
    id: `off-${product.code || fallbackId || product.id || Math.random().toString(36).slice(2, 10)}`,
    name,
    brand,
    servingSize: 100,
    servingUnit: "g",
    barcode: product.code || undefined,
    source: "openfoodfacts",
    nutrients: {
      calories: Number(product.nutriments?.["energy-kcal_100g"] || 0),
      protein: Number(product.nutriments?.proteins_100g || 0),
      carbs: Number(product.nutriments?.carbohydrates_100g || 0),
      fat: Number(product.nutriments?.fat_100g || 0),
      fiber: Number(product.nutriments?.fiber_100g || 0),
      sugar: sugarPer100g,
      addedSugar
    }
  };
};

export async function fetchOpenFoodFactsByBarcode(barcode: string): Promise<FoodItem | null> {
  const response = await fetch(`${OFF_BASE}/${barcode}.json`);
  if (!response.ok) throw new Error("Unable to fetch barcode item from OpenFoodFacts.");
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
  if (!response.ok) throw new Error("Unable to search OpenFoodFacts.");

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
