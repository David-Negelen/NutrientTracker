# Nutrient Tracker (React + TypeScript)

Project outline for a nutrient tracker with barcode scanning, USDA search, custom food creation, and nutrient dashboards.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand
- TanStack Query
- Recharts
- React Router
- react-zxing + @zxing/library

## Routes

- `/dashboard` - nutrient overview (daily/weekly toggle, progress bars, donut + trend chart)
- `/log` - daily food log grouped by meal
- `/add` - food entry hub (barcode, search, custom, recent/favorites)
- `/goals` - nutrient goals and profile settings

## Folder Structure

```text
.
├── src
│   ├── api
│   │   ├── openFoodFacts.ts
│   │   └── usda.ts
│   ├── components
│   │   ├── add
│   │   │   ├── BarcodeScannerPanel.tsx
│   │   │   ├── CustomFoodForm.tsx
│   │   │   ├── FoodSearchPanel.tsx
│   │   │   └── RecentFavoritesPanel.tsx
│   │   ├── common
│   │   │   └── Card.tsx
│   │   ├── dashboard
│   │   │   ├── CalorieRingChart.tsx
│   │   │   ├── NutrientProgressBar.tsx
│   │   │   └── WeeklyMacroTrend.tsx
│   │   ├── layout
│   │   │   └── AppShell.tsx
│   │   └── log
│   │       └── MealGroupSection.tsx
│   ├── hooks
│   │   └── useFoodQueries.ts
│   ├── mock
│   │   └── sampleData.ts
│   ├── pages
│   │   ├── AddFoodPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── GoalsPage.tsx
│   │   └── LogPage.tsx
│   ├── store
│   │   └── useNutrientStore.ts
│   ├── types
│   │   └── nutrition.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Data Models

- `FoodItem`: source food entity from OpenFoodFacts, USDA, or custom input
- `LogEntry`: consumed food event with meal grouping and nutrient snapshot
- `NutrientGoals`: target values for macros and micro nutrients

See `src/types/nutrition.ts` for complete definitions.

## Run

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set USDA API key
3. Start dev server: `npm run dev`
