import type { LogEntry, NutrientGoals, NutrientValues } from "@/types/nutrition";

export interface Tip {
  type: "add" | "swap";
  nutrient: keyof NutrientValues;
  headline: string;
  subline: string;
  alternatives: string[];
}

// ─── Static knowledge ────────────────────────────────────────────────────────

const BOOST_FOODS: Partial<Record<keyof NutrientValues, string[]>> = {
  protein: ["chicken breast", "Greek yogurt", "eggs", "lentils", "cottage cheese", "tofu"],
  fiber: ["oats", "lentils", "broccoli", "chia seeds", "almonds", "avocado"],
};

interface SwapRule {
  keywords: string[];
  alternative: string;
  nutrient: keyof NutrientValues;
}

// Ordered from most-specific to least-specific so the first match wins
const SWAP_RULES: SwapRule[] = [
  // Sugar
  { keywords: ["cola", "coke", "pepsi", "lemonade", "energy drink", "sports drink"], alternative: "sparkling water or unsweetened tea", nutrient: "sugar" },
  { keywords: ["candy", "gummy", "haribo", "gummies", "jelly bean"], alternative: "fresh fruit or dark chocolate (85%+)", nutrient: "sugar" },
  { keywords: ["chocolate bar", "milk chocolate", "white chocolate"], alternative: "dark chocolate (85%+) in a smaller portion", nutrient: "sugar" },
  { keywords: ["granola", "muesli", "cornflakes", "breakfast cereal"], alternative: "plain oats or bran flakes", nutrient: "sugar" },
  { keywords: ["flavored yogurt", "fruit yogurt"], alternative: "plain Greek yogurt with fresh fruit", nutrient: "sugar" },
  { keywords: ["white bread", "toast", "baguette", "croissant", "pretzel"], alternative: "wholegrain or rye bread", nutrient: "sugar" },
  { keywords: ["jam", "honey", "syrup", "nutella"], alternative: "nut butter (no added sugar) or mashed banana", nutrient: "sugar" },
  { keywords: ["fruit juice", "orange juice", "apple juice"], alternative: "whole fruit or a small portion of juice diluted with water", nutrient: "sugar" },

  // Fat
  { keywords: ["butter"], alternative: "avocado spread or a small drizzle of olive oil", nutrient: "fat" },
  { keywords: ["whole milk", "full fat milk", "vollmilch"], alternative: "semi-skimmed or skimmed milk", nutrient: "fat" },
  { keywords: ["chips", "crisps", "french fries", "pommes frites"], alternative: "baked sweet potato wedges or air-popped popcorn", nutrient: "fat" },
  { keywords: ["cream", "heavy cream", "sour cream", "crème fraîche"], alternative: "plain Greek yogurt as a topping", nutrient: "fat" },
  { keywords: ["cheese", "cheddar", "parmesan", "gouda"], alternative: "light cheese or cottage cheese", nutrient: "fat" },
  { keywords: ["fried", "deep fried", "schnitzel", "nuggets"], alternative: "a baked or grilled version of the same dish", nutrient: "fat" },
  { keywords: ["sausage", "salami", "pepperoni", "wurst", "chorizo"], alternative: "lean turkey slices or grilled chicken", nutrient: "fat" },

  // Calories
  { keywords: ["white rice", "weißer reis"], alternative: "half white rice + half cauliflower rice", nutrient: "calories" },
  { keywords: ["white pasta", "spaghetti", "pasta"], alternative: "pasta in a smaller portion with extra vegetables", nutrient: "calories" },
  { keywords: ["burger", "hamburger", "cheeseburger"], alternative: "a grilled chicken sandwich or lettuce-wrap burger", nutrient: "calories" },
  { keywords: ["pizza"], alternative: "a thin-crust pizza with more vegetables and less cheese", nutrient: "calories" },
  { keywords: ["ice cream", "gelato", "frozen yogurt"], alternative: "frozen banana \"nice cream\" or a small scoop with fruit", nutrient: "calories" },
  { keywords: ["donut", "muffin", "brownie", "cake", "cupcake"], alternative: "a smaller portion or a fruit-based snack", nutrient: "calories" },
];

const GENERIC_SWAPS: Partial<Record<keyof NutrientValues, { from: string; to: string }>> = {
  sugar: { from: "sweet snacks or sugary drinks", to: "fresh fruit, nuts, or water" },
  fat: { from: "high-fat items", to: "leaner proteins or steamed vegetables" },
  calories: { from: "calorie-dense snacks", to: "more vegetables and lean proteins" },
};

const NUTRIENT_LABEL: Partial<Record<keyof NutrientValues, string>> = {
  protein: "protein",
  fiber: "fiber",
  carbs: "carbs",
  fat: "fat",
  calories: "calorie",
  sugar: "sugar",
};

// ─── Deterministic "random" pick seeded by date so tips stay stable per day ──

function seededIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

function pickForDay<T>(arr: T[], dateSeed: string, salt: string): T {
  return arr[seededIndex(dateSeed + salt, arr.length)];
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function generateTips(
  totals: NutrientValues,
  goals: NutrientGoals,
  entries: LogEntry[],
  /** ISO date string used to keep suggestions stable for a given day */
  dateIso: string
): Tip[] {
  const tips: Tip[] = [];

  // ── Nutrients to boost (below 60 % of goal) ──
  const goalNutrients: Array<keyof NutrientValues> = ["protein", "fiber"];
  for (const key of goalNutrients) {
    const current = (totals[key] as number) ?? 0;
    const goal = goals[key as keyof NutrientGoals] ?? 0;
    const ratio = goal > 0 ? current / goal : 1;
    if (ratio >= 0.6) continue;

    const options = BOOST_FOODS[key];
    if (!options) continue;

    const food = pickForDay(options, dateIso, key);
    const label = NUTRIENT_LABEL[key] ?? key;
    tips.push({
      type: "add",
      nutrient: key,
      headline: `Eat ${food} to boost your ${label}`,
      subline: `You're at ${Math.round(ratio * 100)} % of your daily ${label} goal — ${food} is a great source.`,
      alternatives: options.filter((f) => f !== food),
    });
  }

  // ── Nutrients over limit (above 110 % of goal) ──
  const limitNutrients: Array<keyof NutrientValues> = ["sugar", "fat", "calories"];
  for (const key of limitNutrients) {
    const current =
      key === "sugar"
        ? ((totals.addedSugar ?? totals.sugar) as number)
        : ((totals[key] as number) ?? 0);
    const limit = goals[key as keyof NutrientGoals] ?? 0;
    const ratio = limit > 0 ? current / limit : 0;
    if (ratio < 1.1) continue;

    const label = NUTRIENT_LABEL[key] ?? key;
    const pct = Math.round(ratio * 100);

    // Find the logged entry contributing most of this nutrient
    const topEntry = [...entries].sort((a, b) => {
      const valA = key === "sugar" ? (a.nutrients.addedSugar ?? a.nutrients.sugar) : ((a.nutrients[key] as number) ?? 0);
      const valB = key === "sugar" ? (b.nutrients.addedSugar ?? b.nutrients.sugar) : ((b.nutrients[key] as number) ?? 0);
      return valB - valA;
    })[0];

    let tip: Tip | null = null;

    if (topEntry) {
      const rule = SWAP_RULES.find(
        (r) =>
          r.nutrient === key &&
          r.keywords.some((kw) => topEntry.foodName.toLowerCase().includes(kw.toLowerCase()))
      );
      if (rule) {
        const name = topEntry.foodName.length > 40 ? topEntry.foodName.slice(0, 38) + "…" : topEntry.foodName;
        const otherAlts = SWAP_RULES
          .filter((r) => r.nutrient === key && r !== rule)
          .map((r) => r.alternative)
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .slice(0, 5);
        tip = {
          type: "swap",
          nutrient: key,
          headline: `Try ${rule.alternative} instead of ${name}`,
          subline: `A similar but lighter choice — your ${label} is at ${pct} % of your daily limit.`,
          alternatives: otherAlts,
        };
      }
    }

    if (!tip) {
      const generic = GENERIC_SWAPS[key];
      if (generic) {
        const allAlts = SWAP_RULES
          .filter((r) => r.nutrient === key)
          .map((r) => r.alternative)
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .slice(0, 5);
        tip = {
          type: "swap",
          nutrient: key,
          headline: `Choose ${generic.to} over ${generic.from}`,
          subline: `Your ${label} intake is at ${pct} % of your daily limit.`,
          alternatives: allAlts,
        };
      }
    }

    if (tip) tips.push(tip);
  }

  return tips.slice(0, 4);
}
