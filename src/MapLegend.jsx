import { conditionColors } from "./conditions"

const entries = [
  ["usable", "Fully usable"],
  ["damaged", "Needs repair"],
  ["blocked", "Blocked"],
  ["unclear", "Unverified"],
]

export default function MapLegend() {
  return (
    <div className="absolute top-3 right-3 z-10 bg-white/95 rounded-lg shadow p-3 space-y-1.5">
      {entries.map(([condition, label]) => (
        <div key={condition} className="flex items-center gap-2 text-xs text-slate-700">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: conditionColors[condition] }}
          />
          {label}
        </div>
      ))}
    </div>
  )
}
