import { useEffect, useState } from "react"
import { ThumbsUp, ThumbsDown, ShieldAlert, Clock } from "lucide-react"
import Pill from "./ui/Pill"
import { conditionLabels, conditionTones } from "./conditions"
import { loadReports, castVote } from "./votes"

function timeAgo(createdAt) {
  if (!createdAt) return "just now"
  const minutes = Math.round((Date.now() - createdAt.seconds * 1000) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
}

function VoteButton({ icon: Icon, count, label, tone, ...props }) {
  return (
    <button
      type="button"
      className="tap inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-micro font-semibold transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      style={{ color: `var(--tone-${tone}-text)` }}
      {...props}
    >
      <Icon size={14} aria-hidden="true" />
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{label}</span>
    </button>
  )
}

export default function ReportList({ locationId, userId, refreshKey, onConfirmed }) {
  const key = `${locationId}:${refreshKey}`
  const [loaded, setLoaded] = useState({ key: null, items: [] })
  const reports = loaded.key === key ? loaded.items : null

  useEffect(() => {
    let active = true
    loadReports(locationId).then((items) => {
      if (active) setLoaded({ key, items })
    })
    return () => {
      active = false
    }
  }, [locationId, key])

  async function vote(report, value) {
    setLoaded((current) => ({
      ...current,
      items: current.items.map((entry) =>
        entry.id === report.id
          ? {
              ...entry,
              voters: [...entry.voters, userId],
              confirmed: entry.confirmed + (value === 1 ? 1 : 0),
              disputed: entry.disputed + (value === -1 ? 1 : 0),
            }
          : entry
      ),
    }))
    const promoted = await castVote(report, userId, value)
    if (promoted) onConfirmed(promoted, locationId)
  }

  if (reports === null) {
    return (
      <div className="space-y-2" aria-busy="true">
        <span className="sr-only">Loading community reports</span>
        {[0, 1].map((row) => (
          <div key={row} className="h-20 animate-pulse rounded-control bg-muted" />
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <p className="rounded-control border border-dashed border-border px-3 py-4 text-center text-micro text-muted-foreground">
        No community reports yet. Add a photo below to be the first.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Community reports</h3>
      <ul className="max-h-56 space-y-2 overflow-y-auto">
        {reports.map((report) => {
          const voted = report.voters.includes(userId)
          const isOwn = report.reporterId === userId
          return (
            <li key={report.id} className="space-y-2 rounded-control border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <Pill tone={conditionTones[report.condition]}>
                  {report.featureType.replace(/_/g, " ")}: {conditionLabels[report.condition]}
                </Pill>
                <span className="shrink-0 text-micro text-muted-foreground">
                  {timeAgo(report.createdAt)}
                </span>
              </div>

              <p className="text-sm">{report.summary}</p>

              {report.pending && (
                <p className="flex items-center gap-1.5 text-micro text-muted-foreground">
                  <Clock size={13} aria-hidden="true" />
                  Waiting for a second person to confirm before the map updates
                </p>
              )}
              {report.needsReview && (
                <p
                  className="flex items-center gap-1.5 text-micro"
                  style={{ color: "var(--tone-warning-text)" }}
                >
                  <ShieldAlert size={13} aria-hidden="true" />
                  Flagged for review
                </p>
              )}

              <div className="flex items-center gap-2">
                <VoteButton
                  icon={ThumbsUp}
                  tone="success"
                  count={report.confirmed}
                  label={`Confirm this report. ${report.confirmed} people agree`}
                  onClick={() => vote(report, 1)}
                  disabled={voted || isOwn}
                />
                <VoteButton
                  icon={ThumbsDown}
                  tone="danger"
                  count={report.disputed}
                  label={`Dispute this report. ${report.disputed} people disagree`}
                  onClick={() => vote(report, -1)}
                  disabled={voted || isOwn}
                />
                {isOwn && <span className="text-micro text-muted-foreground">Your report</span>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
