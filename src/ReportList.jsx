import { useEffect, useState } from "react"
import { ThumbsUp, ThumbsDown, ShieldAlert } from "lucide-react"
import { loadReports, castVote } from "./votes"

function timeAgo(createdAt) {
  if (!createdAt) return "just now"
  const minutes = Math.round((Date.now() - createdAt.seconds * 1000) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
}

export default function ReportList({ locationId, userId, refreshKey }) {
  const [reports, setReports] = useState([])

  useEffect(() => {
    loadReports(locationId).then(setReports)
  }, [locationId, refreshKey])

  async function vote(reportId, value) {
    setReports((current) =>
      current.map((report) =>
        report.id === reportId
          ? {
              ...report,
              voters: [...report.voters, userId],
              confirmed: report.confirmed + (value === 1 ? 1 : 0),
              disputed: report.disputed + (value === -1 ? 1 : 0),
            }
          : report
      )
    )
    await castVote(reportId, userId, value)
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
          <li key={report.id} className="border border-slate-200 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{report.featureType.replace("_", " ")} · {report.condition}</span>
              <span>{timeAgo(report.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-700">{report.summary}</p>
            {report.needsReview && (
              <p className="flex items-center gap-1.5 text-xs text-amber-700">
                <ShieldAlert size={13} />
                Flagged for review
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => vote(report.id, 1)}
                disabled={voted || isOwn}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-200 text-emerald-700 disabled:opacity-40"
              >
                <ThumbsUp size={13} />
                {report.confirmed}
              </button>
              <button
                onClick={() => vote(report.id, -1)}
                disabled={voted || isOwn}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-200 text-red-700 disabled:opacity-40"
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
