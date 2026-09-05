import { useState } from "react"
import { Check, MapPin, Navigation, Search } from "lucide-react"
import LocationList from "../LocationList"
import PhotoVerifier from "../PhotoVerifier"
import Button from "../ui/Button"
import Card from "../ui/Card"
import ScreenHeader from "../ui/ScreenHeader"
import Spinner from "../ui/Spinner"
import ListSkeleton from "../ui/ListSkeleton"
import LoadFailure from "../ui/LoadFailure"
import { byDistanceFrom } from "../distance"

const steps = ["Choose a place", "Add a photo"]

function Progress({ step }) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <p className="text-micro text-[var(--header-muted)]">
        Step {step + 1} of {steps.length}: {steps[step]}
      </p>
      <div className="mt-2 flex gap-1" role="presentation">
        {steps.map((name, index) => (
          <span
            key={name}
            className={`h-1 flex-1 rounded-full ${
              index <= step ? "bg-[var(--header-foreground)]" : "bg-[var(--header-surface)]"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default function ReportScreen({
  locations,
  userId,
  onReported,
  origin,
  onLocate,
  locating,
  status,
  onRetry,
}) {
  const [search, setSearch] = useState("")
  const [chosenId, setChosenId] = useState(null)
  const chosen = locations.find((location) => location.id === chosenId) ?? null

  const term = search.trim().toLowerCase()
  const matching = term
    ? locations.filter((location) => location.name.toLowerCase().includes(term))
    : locations
  const ordered = origin ? [...matching].sort(byDistanceFrom(origin)) : matching

  return (
    <>
      <ScreenHeader
        title="Report a barrier"
        subtitle={chosen ? chosen.name : "Photo-checked accessibility reports"}
        onBack={chosen ? () => setChosenId(null) : undefined}
        backLabel="Choose a different place"
      />
      <div className="shrink-0 bg-header px-4 pb-4 text-[var(--header-foreground)]">
        <Progress step={chosen ? 1 : 0} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          {chosen ? (
            <div className="space-y-4">
              <Card className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[var(--accent-foreground)]">
                  <Check size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{chosen.name}</p>
                  <p className="truncate text-micro text-muted-foreground">{chosen.category}</p>
                </div>
                <Button variant="secondary" onClick={() => setChosenId(null)}>
                  Change
                </Button>
              </Card>

              <Card>
                <PhotoVerifier location={chosen} userId={userId} onReported={onReported} />
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
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
                  placeholder="Search for the place you are at"
                  className="w-full rounded-control border border-border bg-[var(--input)] py-3 pl-9 pr-3 text-sm placeholder:text-muted-foreground"
                />
              </div>

              {!origin && (
                <Button variant="secondary" onClick={onLocate} disabled={locating} full>
                  {locating ? (
                    <Spinner label="Finding your location" size={16} />
                  ) : (
                    <Navigation size={16} aria-hidden="true" />
                  )}
                  {locating ? "Finding you" : "Sort by what is nearest"}
                </Button>
              )}

              <div>
                <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <MapPin size={15} aria-hidden="true" className="text-muted-foreground" />
                  {origin ? "Nearest places" : "All places"}
                </h2>
                {status === "loading" ? (
                  <ListSkeleton label="Loading places" />
                ) : status === "error" ? (
                  <LoadFailure message="Could not load places." onRetry={onRetry} />
                ) : (
                  <LocationList
                    locations={ordered}
                    selectedId={null}
                    onSelect={(location) => setChosenId(location.id)}
                    origin={origin}
                    emptyMessage={
                      term ? `No places match "${search.trim()}".` : "No places are loaded yet."
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
