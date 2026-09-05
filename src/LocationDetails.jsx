import { useEffect } from "react"
import { X, ShieldCheck, AlertTriangle, FileDown, Clock } from "lucide-react"
import PhotoVerifier from "./PhotoVerifier"
import ReportList from "./ReportList"
import Button from "./ui/Button"
import Pill from "./ui/Pill"
import {
  conditionLabels,
  conditionTones,
  trackedFeatures,
  featureLabels,
  featureState,
  describeAge,
} from "./conditions"
import { loadReports } from "./votes"
import { reportsToCsv, downloadCsv, csvFilename } from "./exportReport"

function Provenance({ state }) {
  if (state.confirmations === 0) {
    return <span className="text-micro text-muted-foreground">No reports yet</span>
  }
  if (state.confirmed) {
    return (
      <span
        className="flex items-center gap-1 text-micro"
        style={{ color: "var(--tone-success-text)" }}
      >
        <ShieldCheck size={13} aria-hidden="true" />
        Confirmed by {state.confirmations}, checked {describeAge(state.lastVerified)}
      </span>
    )
  }
  return (
    <span
      className="flex items-center gap-1 text-micro"
      style={{ color: "var(--tone-warning-text)" }}
    >
      {state.stale ? (
        <Clock size={13} aria-hidden="true" />
      ) : (
        <AlertTriangle size={13} aria-hidden="true" />
      )}
      {state.stale
        ? `Not confirmed recently, last checked ${describeAge(state.lastVerified)}`
        : `Reported by ${state.confirmations}, ${describeAge(state.lastVerified)}, awaiting confirmation`}
    </span>
  )
}

export default function LocationDetails({ location, userId, reportKey, onClose, onReported }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  async function exportCsv() {
    const reports = await loadReports(location.id)
    downloadCsv(csvFilename(location), reportsToCsv(location, reports))
  }

  return (
    <section
      aria-label={`Accessibility details for ${location.name}`}
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[78%] flex-col rounded-t-hero border border-border bg-card shadow-float md:inset-y-3 md:left-auto md:right-3 md:max-h-none md:w-[22rem] md:rounded-hero lg:w-96"
    >
      <div className="shrink-0 px-5 pb-3 pt-3">
        <span
          aria-hidden="true"
          className="mx-auto mb-3 block h-1 w-10 rounded-full bg-border md:hidden"
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold tracking-tight">
              {location.name}
            </h2>
            <p className="text-micro text-muted-foreground">{location.category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="tap -mr-2 -mt-2 grid shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-5">
        <ul className="space-y-2">
          {trackedFeatures.map((key) => {
            const state = featureState(location, key)
            return (
              <li
                key={key}
                className="flex items-start justify-between gap-3 rounded-control bg-muted px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{featureLabels[key]}</p>
                  <Provenance state={state} />
                </div>
                <Pill tone={conditionTones[state.condition]} className="shrink-0">
                  {conditionLabels[state.condition]}
                </Pill>
              </li>
            )
          })}
        </ul>

        <ReportList
          locationId={location.id}
          userId={userId}
          refreshKey={reportKey}
          onConfirmed={onReported}
        />

        <Button variant="secondary" onClick={exportCsv} full>
          <FileDown size={16} aria-hidden="true" />
          Export reports for council
        </Button>

        <div className="border-t border-border pt-4">
          <PhotoVerifier location={location} userId={userId} onReported={onReported} />
        </div>
      </div>
    </section>
  )
}
