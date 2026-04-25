import { useQuery } from "@tanstack/react-query";
import { fetchOpenFoodFactsByBarcode, searchOpenFoodFactsFoods } from "@/api/openFoodFacts";
import { FoodSearchResult, searchUsdaFoods } from "@/api/usda";

export function useBarcodeLookup(barcode: string) {
  return useQuery({
    queryKey: ["barcode-lookup", barcode],
    queryFn: () => fetchOpenFoodFactsByBarcode(barcode),
    enabled: barcode.length > 6
  });
}

const dedupeResults = (results: FoodSearchResult[]): FoodSearchResult[] => {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.label.toLowerCase()}-${(result.subtitle || "").toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ["food-search", query],
    queryFn: async () => {
      const [usdaResult, offResult] = await Promise.allSettled([
        searchUsdaFoods(query),
        searchOpenFoodFactsFoods(query)
      ]);

      const usda = usdaResult.status === "fulfilled" ? usdaResult.value : [];
      const off = offResult.status === "fulfilled" ? offResult.value : [];
      return dedupeResults([...off, ...usda]).slice(0, 12);
    },
    enabled: query.trim().length >= 2
  });
}