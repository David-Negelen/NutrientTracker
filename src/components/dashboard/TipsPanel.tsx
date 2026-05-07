import { useMemo, useState } from "react";
import type { LogEntry, NutrientGoals, NutrientValues } from "@/types/nutrition";
import { generateTips, type Tip } from "@/utils/tips";

interface TipsPanelProps {
  totals: NutrientValues;
  goals: NutrientGoals;
  entries: LogEntry[];
  dateIso: string;
}

const TIP_STYLES: Record<Tip["type"], { wrapper: string; icon: string; symbol: string }> = {
  add: {
    wrapper: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
    symbol: "+",
  },
  swap: {
    wrapper: "bg-amber-50 dark:bg-amber-900/20",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
    symbol: "↔",
  },
};

function TipCard({ tip }: { tip: Tip }) {
  const [expanded, setExpanded] = useState(false);
  const style = TIP_STYLES[tip.type];
  const hasAlternatives = tip.alternatives.length > 0;

  return (
    <div
      className={`rounded-xl p-3 transition-colors ${style.wrapper} ${hasAlternatives ? "cursor-pointer" : ""}`}
      onClick={hasAlternatives ? () => setExpanded((e) => !e) : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${style.icon}`}>
          {style.symbol}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{tip.headline}</p>
            {hasAlternatives && (
              <span className="mt-0.5 shrink-0 text-xs text-slate-400 select-none dark:text-slate-500">
                {expanded ? "▲" : "▼"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{tip.subline}</p>
        </div>
      </div>

      {expanded && (
        <div className="ml-10 mt-2.5 space-y-1.5 border-t border-black/5 pt-2.5 dark:border-white/10">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {tip.type === "add" ? "Other great sources:" : "Other alternatives:"}
          </p>
          <ul className="space-y-1">
            {tip.alternatives.map((alt, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="mt-px shrink-0 text-slate-400">•</span>
                {alt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function TipsPanel({ totals, goals, entries, dateIso }: TipsPanelProps) {
  const tips = useMemo(
    () => generateTips(totals, goals, entries, dateIso),
    [totals, goals, entries, dateIso]
  );

  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
        Log some food first to get personalised tips.
      </p>
    );
  }

  if (tips.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-emerald-600 dark:text-emerald-400">
        You're on track today — great job!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tips.map((tip, i) => (
        <TipCard key={i} tip={tip} />
      ))}
    </div>
  );
}
