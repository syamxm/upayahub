import AccessibilityMap from "../AccessibilityMap"
import LocationDetails from "../LocationDetails"
import MapLegend from "../MapLegend"
import MapFilters from "../MapFilters"
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
}) {
  return (
    <>
      <ScreenHeader title="UpayaHub" subtitle="Know before you go." />
      <MapFilters
        active={filters}
        onToggle={onToggleFilter}
        shown={visible.length}
        total={locations.length}
      />
      <div className="relative min-h-0 flex-1">
        <AccessibilityMap locations={visible} onSelect={onSelect} />
        <MapLegend />
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
    </>
  )
}
