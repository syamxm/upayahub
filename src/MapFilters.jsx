import { trackedFeatures, featureLabels } from "./conditions"
import Chip from "./ui/Chip"

export default function MapFilters({ active, onToggle, shown, total }) {
  return (
    <div className="shrink-0 border-b border-border bg-card">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="flex gap-2 overflow-x-auto pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {trackedFeatures.map((key) => (
            <Chip key={key} pressed={active.includes(key)} onClick={() => onToggle(key)}>
              {featureLabels[key]}
            </Chip>
          ))}
        </div>
        <p className="py-2 text-micro text-muted-foreground" aria-live="polite">
          {active.length === 0
            ? `Showing all ${total} places`
            : `Showing ${shown} of ${total} places`}
        </p>
      </div>
    </div>
  )
}
