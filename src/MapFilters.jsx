import { trackedFeatures, featureLabels } from "./conditions"

export default function MapFilters({ active, onToggle, shown, total }) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="flex gap-2 overflow-x-auto px-4 pt-2">
        {trackedFeatures.map((key) => {
          const on = active.includes(key)
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              aria-pressed={on}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium ${
                on
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 text-slate-700"
              }`}
            >
              {featureLabels[key]}
            </button>
          )
        })}
      </div>
      <p className="px-4 py-1.5 text-xs text-slate-500" aria-live="polite">
        {active.length === 0
          ? `Showing all ${total} places`
          : `Showing ${shown} of ${total} places`}
      </p>
    </div>
  )
}
