/**
 * Estimates natural lactose content (g per 100 g/ml) based on product name and brand.
 * Returns null if the product is not recognisably dairy.
 *
 * Dairy products naturally contain lactose which is NOT added sugar.
 * Typical lactose levels per 100 g (approximate, varies by brand):
 *   Whole / skim milk        ~4.7 g
 *   Yogurt / Skyr            ~4.0 g
 *   Quark / Fromage frais    ~3.0 g
 *   Kefir                    ~3.5 g
 *   Buttermilk               ~4.5 g
 *   Cream / sour cream       ~3.5 g
 *   Milk-based protein drink ~4.0 g
 *   Hard cheese              ~0.0 g (negligible — skip estimation)
 */
export function estimateLactoseG(name: string, brand?: string): number | null {
  const text = `${name} ${brand ?? ""}`.toLowerCase();

  // Hard/semi-hard cheeses have negligible lactose — skip estimation
  if (/\b(käse|cheese|gouda|emmental|parmesan|cheddar|brie|camembert|mozzarella|feta|halloumi|gruyère|gruyere)\b/.test(text)) {
    return null;
  }

  // Plant-based milks contain no lactose
  if (/\b(oat|hafer|soy|soja|soya|almond|mandel|rice|reis|coconut|kokos|hemp|hanf)\b.*\b(milk|milch|drink)\b/.test(text)) {
    return null;
  }

  if (/\b(quark|magerquark|speisequark|fromage frais|skyr|hüttenkäse|cottage)\b/.test(text)) return 3.0;
  if (/\b(joghurt|yogurt|yoghurt|jghrt)\b/.test(text)) return 4.0;
  if (/\b(kefir)\b/.test(text)) return 3.5;
  if (/\b(buttermilch|buttermilk)\b/.test(text)) return 4.5;
  if (/\b(sahne|schlagsahne|cream|crème fraîche|creme fraiche|soured cream|sour cream|schmand|crema)\b/.test(text)) return 3.5;
  if (/\b(protein shake|protein drink|high protein|eiweißdrink|eiweißshake|protein milk)\b/.test(text)) return 4.0;
  if (/\b(milch|milk|latte|leche)\b/.test(text)) return 4.7;

  return null;
}

export function computeAddedSugar(sugarPer100g: number, name: string, brand?: string): number | undefined {
  const lactose = estimateLactoseG(name, brand);
  return lactose !== null ? Math.max(0, sugarPer100g - lactose) : undefined;
}
