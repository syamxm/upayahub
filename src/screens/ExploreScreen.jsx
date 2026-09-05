import { useState } from "react"
import { Navigation, Search } from "lucide-react"
import AccessibilityMap from "../AccessibilityMap"
import LocationDetails from "../LocationDetails"
import LocationList from "../LocationList"
import MapLegend from "../MapLegend"
import MapFilters from "../MapFilters"
import BottomSheet from "../ui/BottomSheet"
import ScreenHeader from "../ui/ScreenHeader"

export default function ExploreScreen({
  locations,
  visible,
  filters,
  onToggleFilter,
  selected,
  onSelect,
  onClearSelection,
  userId,
  reportKey,
  onReported,
  origin,
  onLocate,
  locating,
}) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)

  const term = search.trim().toLowerCase()
  const listed = term
    ? visible.filter((location) => location.name.toLowerCase().includes(term))
    : visible

  const emptyMessage = term
    ? `No places match "${search.trim()}".`
    : "No places match these filters yet."

  function choose(location) {
    onSelect(location)
    setSheetOpen(false)
  }

  return (
    <>
      <ScreenHeader title="UpayaHub" subtitle="Know before you go.">
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          aria-label={origin ? "Update your location" : "Show distances from where you are"}
          className="tap grid place-items-center rounded-full text-[var(--header-foreground)] hover:bg-[var(--header-surface)] disabled:opacity-50"
        >
          <Navigation size={18} aria-hidden="true" />
        </button>
      </ScreenHeader>

      <div className="shrink-0 bg-header px-4 pb-4">
        <div className="relative mx-auto w-full max-w-5xl">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search places by name"
            placeholder="Search stations, malls, clinics"
            className="w-full rounded-control border border-border bg-[var(--input)] py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <MapFilters
        active={filters}
        onToggle={onToggleFilter}
        shown={listed.length}
        total={locations.length}
      />

      <div className="flex min-h-0 flex-1 md:flex-row">
        <div className="hidden shrink-0 overflow-y-auto border-r border-border bg-background p-3 md:block md:w-72 lg:w-80">
          <LocationList
            locations={listed}
            selectedId={selected?.id ?? null}
            onSelect={onSelect}
            origin={origin}
            emptyMessage={emptyMessage}
          />
        </div>

        <div className="relative min-h-0 flex-1">
          <AccessibilityMap locations={listed} onSelect={onSelect} />
          <MapLegend />

          <BottomSheet
            title={`${listed.length} ${listed.length === 1 ? "place" : "places"}`}
            expanded={sheetOpen}
            onToggle={setSheetOpen}
          >
            <LocationList
              locations={listed}
              selectedId={selected?.id ?? null}
              onSelect={choose}
              origin={origin}
              emptyMessage={emptyMessage}
            />
          </BottomSheet>

          {selected && (
            <LocationDetails
              location={selected}
              userId={userId}
              reportKey={reportKey}
              onClose={onClearSelection}
              onReported={onReported}
            />
          )}
        </div>
      </div>
    </>
  )
}
