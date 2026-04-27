import { type RefObject, useState } from "react";
import { useZxing } from "react-zxing";
import { FoodItem } from "@/types/nutrition";
import { NutritionDetails } from "@/components/common/NutritionDetails";

interface BarcodeScannerPanelProps {
  onBarcodeDetected: (barcode: string) => void;
  scannedFood: FoodItem | null | undefined;
  isLoading?: boolean;
  onQuickAdd: (food: FoodItem) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (foodId: string) => void;
}

export function BarcodeScannerPanel({
  onBarcodeDetected,
  scannedFood,
  isLoading,
  onQuickAdd,
  favoriteIds = [],
  onToggleFavorite
}: BarcodeScannerPanelProps) {
  const [manualBarcode, setManualBarcode] = useState("");
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const { ref } = useZxing({
    paused: !isScannerActive,
    onDecodeResult(result) {
      const detected = result.getText();
      onBarcodeDetected(detected);
      setManualBarcode(detected);
      setIsScannerActive(false);
    }
  });
  const videoRef = ref as RefObject<HTMLVideoElement>;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <button
          onClick={() => setIsScannerActive((prev) => !prev)}
          className={[
            "rounded-xl px-4 py-2 text-sm font-semibold text-white",
            isScannerActive ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-600 hover:bg-brand-700"
          ].join(" ")}
        >
          {isScannerActive ? "Stop camera" : "Use camera to scan"}
        </button>
        {isScannerActive ? (
          <video ref={videoRef} className="w-full rounded-2xl bg-slate-900" />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Camera is off. Press "Use camera to scan" to activate.
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={manualBarcode}
          onChange={(event) => setManualBarcode(event.target.value)}
          placeholder="Enter barcode manually"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
        <button
          onClick={() => onBarcodeDetected(manualBarcode.trim())}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Lookup
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Looking up product…</p>
      ) : null}

      {scannedFood ? (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-900/20">
          <button onClick={() => setExpandedDetails(!expandedDetails)} className="w-full text-left">
            <p className="font-semibold text-slate-800 dark:text-slate-200">{scannedFood.name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {Math.round(scannedFood.nutrients.calories)} kcal per serving
            </p>
          </button>
          {expandedDetails && (
            <div className="mt-3 border-t border-brand-200 pt-3 dark:border-brand-800">
              <NutritionDetails
                nutrients={scannedFood.nutrients}
                servingSize={scannedFood.servingSize}
                servingUnit={scannedFood.servingUnit}
              />
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                onQuickAdd(scannedFood);
                setAddedFeedback(true);
                window.setTimeout(() => setAddedFeedback(false), 1200);
              }}
              className={[
                "flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition",
                addedFeedback ? "bg-emerald-600" : "bg-brand-600 hover:bg-brand-700"
              ].join(" ")}
            >
              {addedFeedback ? "Added!" : "Add to log"}
            </button>
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(scannedFood.id)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-semibold",
                  favoriteIds.includes(scannedFood.id)
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                ].join(" ")}
                title={favoriteIds.includes(scannedFood.id) ? "Remove from favorites" : "Add to favorites"}
              >
                {favoriteIds.includes(scannedFood.id) ? "★" : "☆"}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
