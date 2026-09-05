import { useEffect, useState } from "react"
import { ThumbsUp, ThumbsDown, ShieldAlert, Clock } from "lucide-react"
import { loadReports, castVote } from "./votes"

function timeAgo(createdAt) {
  if (!createdAt) return "just now"
  const minutes = Math.round((Date.now() - createdAt.seconds * 1000) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
}

export default function ReportList({ locationId, userId, refreshKey, onConfirmed }) {
  const [reports, setReports] = useState([])

  useEffect(() => {
    loadReports(locationId).then(setReports)
  }, [locationId, refreshKey])

  async function vote(report, value) {
    setReports((current) =>
      current.map((entry) =>
        entry.id === report.id
          ? {
              ...entry,
              voters: [...entry.voters, userId],
              confirmed: entry.confirmed + (value === 1 ? 1 : 0),
              disputed: entry.disputed + (value === -1 ? 1 : 0),
            }
          : entry
      )
    )
    const promoted = await castVote(report, userId, value)
    if (promoted) onConfirmed(promoted)
  }

  if (reports.length === 0) {
    return <p className="text-sm text-slate-400">No community reports yet.</p>
  }

  return (
    <ul className="space-y-2 max-h-48 overflow-y-auto">
      {reports.map((report) => {
        const voted = report.voters.includes(userId)
        const isOwn = report.reporterId === userId
        return (
          <li key={report.id} className="space-y-1.5 rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{report.featureType.replace("_", " ")} · {report.condition}</span>
              <span>{timeAgo(report.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-700">{report.summary}</p>
            {report.pending && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={13} />
                Awaiting confirmation before this updates the map
              </p>
            )}
            {report.needsReview && (
              <p className="flex items-center gap-1.5 text-xs text-amber-700">
                <ShieldAlert size={13} />
                Flagged for review
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => vote(report, 1)}
                disabled={voted || isOwn}
                className="flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-40"
              >
                <ThumbsUp size={13} />
                {report.confirmed}
              </button>
              <button
                onClick={() => vote(report, -1)}
                disabled={voted || isOwn}
                className="flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-red-700 disabled:opacity-40"
              >
                <ThumbsDown size={13} />
                {report.disputed}
              </button>
              {isOwn && <span className="text-xs text-slate-400">your report</span>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
