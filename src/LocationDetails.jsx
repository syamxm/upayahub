import { X, ShieldCheck, AlertTriangle, FileDown } from "lucide-react"
import PhotoVerifier from "./PhotoVerifier"
import ReportList from "./ReportList"
import { conditionColors, trackedFeatures, featureState, describeAge } from "./conditions"
import { loadReports } from "./votes"
import { reportsToCsv, downloadCsv, csvFilename } from "./exportReport"

const labels = {
  ramp: "Ramp",
  elevator: "Elevator",
  tactilePaving: "Tactile paving",
  accessibleToilet: "Accessible toilet",
}

function Provenance({ state }) {
  if (state.confirmations === 0) {
    return <span className="text-xs text-slate-400">No reports yet</span>
  }
  if (state.confirmed) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-700">
        <ShieldCheck size={12} />
        Confirmed by {state.confirmations} · verified {describeAge(state.lastVerified)}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-amber-700">
      <AlertTriangle size={12} />
      {state.stale
        ? `Unconfirmed · last verified ${describeAge(state.lastVerified)}`
        : `Reported by ${state.confirmations} · ${describeAge(state.lastVerified)} · unconfirmed`}
    </span>
  )
}

export default function LocationDetails({ location, userId, reportKey, onClose, onReported }) {
  async function exportCsv() {
    const reports = await loadReports(location.id)
    downloadCsv(csvFilename(location), reportsToCsv(location, reports))
  }

  return (
    <div className="absolute inset-x-3 bottom-3 z-10 max-h-[75%] overflow-y-auto rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-900/5 space-y-4 md:inset-y-3 md:left-auto md:right-3 md:w-96 md:max-h-[calc(100%-1.5rem)]">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{location.name}</h2>
          <p className="text-sm text-slate-500">{location.category}</p>
        </div>
        <button onClick={onClose} aria-label="Close details" className="text-slate-400 shrink-0">
          <X size={20} />
        </button>
      </div>

      <ul className="space-y-2">
        {trackedFeatures.map((key) => {
          const state = featureState(location, key)
          return (
            <li key={key} className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-slate-700">{labels[key]}</p>
                <Provenance state={state} />
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: conditionColors[state.condition] }}
              >
                {state.condition}
              </span>
            </li>
          )
        })}
      </ul>

      <ReportList locationId={location.id} userId={userId} refreshKey={reportKey} onConfirmed={onReported} />

      <button
        onClick={exportCsv}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 py-2.5 text-sm font-semibold text-slate-700"
      >
        <FileDown size={15} />
        Export reports for council (CSV)
      </button>
      <PhotoVerifier location={location} userId={userId} onReported={onReported} />
    </div>
  )
}
