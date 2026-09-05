import { ChevronRight, MapPin } from "lucide-react"
import ScoreBadge from "./ui/ScoreBadge"
import Pill from "./ui/Pill"
import {
  accessibilityScore,
  conditionLabels,
  conditionTones,
  featureLabels,
  featureState,
  trackedFeatures,
  worstCondition,
} from "./conditions"
import { describeDistance, distanceKm } from "./distance"

function usableFeatures(location) {
  return trackedFeatures.filter((key) => featureState(location, key).condition === "usable")
}

export default function LocationList({ locations, selectedId, onSelect, origin, emptyMessage }) {
  if (locations.length === 0) {
    return (
      <p className="rounded-control border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {locations.map((location) => {
        const score = accessibilityScore(location)
        const worst = worstCondition(location)
        const usable = usableFeatures(location)
        const isSelected = location.id === selectedId

        return (
          <li key={location.id}>
            <button
              type="button"
              onClick={() => onSelect(location)}
              aria-current={isSelected ? "true" : undefined}
              className={`flex w-full items-start gap-3 rounded-card border p-3 text-left transition-colors ${
                isSelected ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted"
              }`}
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                <MapPin size={16} aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="truncate font-display text-sm font-semibold">
                    {location.name}
                  </span>
                  <ScoreBadge score={score} />
                </span>

                <span className="mt-0.5 block truncate text-micro text-muted-foreground">
                  {location.category}
                  {origin && `, ${describeDistance(distanceKm(origin, location))}`}
                </span>

                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Pill tone={conditionTones[worst]}>{conditionLabels[worst]}</Pill>
                  {usable.length > 0 && (
                    <span className="text-micro text-muted-foreground">
                      {usable.map((key) => featureLabels[key]).join(", ")}
                    </span>
                  )}
                </span>
              </span>

              <ChevronRight
                size={16}
                aria-hidden="true"
                className="mt-1 shrink-0 text-muted-foreground"
              />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
