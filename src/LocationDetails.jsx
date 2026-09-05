import { X } from "lucide-react"
import PhotoVerifier from "./PhotoVerifier"

const conditionStyles = {
  usable: "bg-emerald-100 text-emerald-800",
  damaged: "bg-amber-100 text-amber-800",
  blocked: "bg-red-100 text-red-800",
  unclear: "bg-slate-100 text-slate-600",
  none: "bg-slate-100 text-slate-600",
}

const features = [
  ["ramp", "Ramp"],
  ["elevator", "Elevator"],
  ["tactilePaving", "Tactile paving"],
  ["accessibleToilet", "Accessible toilet"],
]

export default function LocationDetails({ location, onClose }) {
  return (
    <div className="absolute inset-x-4 bottom-4 z-10 bg-white rounded-lg shadow-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-bold text-slate-900">{location.name}</h2>
          <p className="text-sm text-slate-500">{location.category}</p>
        </div>
        <button onClick={onClose} aria-label="Close details" className="text-slate-400">
          <X size={20} />
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {features.map(([key, label]) => (
          <li key={key} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-slate-700">{label}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${conditionStyles[location[key]]}`}>
              {location[key]}
            </span>
          </li>
        ))}
      </ul>
      <PhotoVerifier />
    </div>
  )
}
