import { X, ShieldCheck, AlertTriangle } from "lucide-react"
import PhotoVerifier from "./PhotoVerifier"
import ReportList from "./ReportList"
import { conditionColors, trackedFeatures, featureState, describeAge } from "./conditions"

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
  return (
    <div className="absolute inset-x-4 bottom-4 z-10 bg-white rounded-lg shadow-lg p-4 space-y-3 max-h-[75%] overflow-y-auto">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900">{location.name}</h2>
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
            <li key={key} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-700">{labels[key]}</p>
                <Provenance state={state} />
              </div>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium shrink-0 text-white"
                style={{ backgroundColor: conditionColors[state.condition] }}
              >
                {state.condition}
              </span>
            </li>
          )
        })}
      </ul>

      <ReportList locationId={location.id} userId={userId} refreshKey={reportKey} onConfirmed={onReported} />
      <PhotoVerifier location={location} userId={userId} onReported={onReported} />
    </div>
  )
}
