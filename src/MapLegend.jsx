import { conditionColors } from "./conditions"

const entries = [
  ["usable", "Fully usable"],
  ["damaged", "Needs repair"],
  ["blocked", "Blocked"],
  ["unclear", "Unverified"],
]

export default function MapLegend() {
  return (
    <div className="absolute right-3 top-3 z-10 space-y-1.5 rounded-card border border-border bg-card/95 p-3 shadow-raised backdrop-blur-sm md:left-3 md:right-auto">
      {entries.map(([condition, label]) => (
        <div key={condition} className="flex items-center gap-2 text-micro text-foreground">
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: conditionColors[condition] }}
          />
          {label}
        </div>
      ))}
    </div>
  )
}
