import { useEffect, useState } from "react"
import { X, Award } from "lucide-react"
import { loadLeaderboard } from "./leaderboard"

export default function Leaderboard({ userId, onClose }) {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    loadLeaderboard().then(setEntries)
  }, [])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f1923]/50 p-4">
      <div className="flex max-h-[80%] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">Top contributors</h2>
          <button onClick={onClose} aria-label="Close leaderboard" className="text-slate-400">
            <X size={20} />
          </button>
        </div>
        {entries === null ? (
          <p className="p-4 text-sm text-slate-400">Loading...</p>
        ) : (
          <ol className="overflow-y-auto divide-y divide-slate-100">
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                className={`flex items-center gap-3 p-3 ${entry.id === userId ? "bg-emerald-50" : ""}`}
              >
                <span className="w-5 text-sm font-semibold text-slate-400">{index + 1}</span>
                {entry.photo ? (
                  <img
                    src={entry.photo}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 shrink-0 rounded-full bg-slate-200 grid place-items-center text-sm font-semibold text-slate-600">
                    {entry.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{entry.name}</p>
                  <p className="text-xs text-slate-500">
                    {entry.reportCount} reports
                    {entry.credibility !== null &&
                      ` · ${entry.credibility}% confirmed by ${entry.votesReceived}`}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                  <Award size={14} />
                  {entry.points}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
