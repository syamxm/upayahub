import { useEffect, useState } from "react"
import { CheckCircle, Clock, MapPin, ShieldAlert, ThumbsDown, ThumbsUp, Users } from "lucide-react"
import Chip from "../ui/Chip"
import Card from "../ui/Card"
import Pill from "../ui/Pill"
import ScreenHeader from "../ui/ScreenHeader"
import { conditionLabels, conditionTones } from "../conditions"
import { loadCommunityStats, loadFeed } from "../feed"

const statuses = {
  onMap: { label: "On the map", tone: "success", icon: CheckCircle },
  awaiting: { label: "Awaiting confirmation", tone: "warning", icon: Clock },
  flagged: { label: "Flagged for review", tone: "danger", icon: ShieldAlert },
}

const filters = [
  { key: "all", label: "All reports" },
  { key: "onMap", label: "On the map" },
  { key: "awaiting", label: "Awaiting confirmation" },
  { key: "flagged", label: "Flagged" },
]

function timeAgo(createdAt) {
  if (!createdAt) return "just now"
  const minutes = Math.round((Date.now() - createdAt.seconds * 1000) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
}

function Stat({ label, value }) {
  return (
    <Card className="text-center" padded={false}>
      <div className="px-2 py-3">
        <p className="font-display text-xl font-bold leading-none">
          {value === null ? "--" : value}
        </p>
        <p className="mt-1 text-micro leading-tight text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

export default function CommunityScreen({ onOpenLocation }) {
  const [feed, setFeed] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    let active = true
    Promise.all([loadFeed(), loadCommunityStats()])
      .then(([reports, counts]) => {
        if (!active) return
        setFeed(reports)
        setStats(counts)
      })
      .catch(() => {
        if (active) setError("Could not load community reports just now.")
      })
    return () => {
      active = false
    }
  }, [])

  const shown = feed?.filter((report) => filter === "all" || report.status === filter) ?? []

  return (
    <>
      <ScreenHeader title="Community" subtitle="Recent reports from across the city" />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Reports this week" value={stats?.thisWeek ?? null} />
            <Stat label="Contributors" value={stats?.contributors ?? null} />
            <Stat label="Places tracked" value={stats?.places ?? null} />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map(({ key, label }) => (
              <Chip key={key} pressed={filter === key} onClick={() => setFilter(key)}>
                {label}
              </Chip>
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-card border p-3 text-sm"
              style={{
                background: "var(--tone-danger-surface)",
                borderColor: "var(--tone-danger-border)",
                color: "var(--tone-danger-text)",
              }}
            >
              {error}
            </p>
          )}

          {feed === null && !error && (
            <div className="space-y-3" aria-busy="true">
              <span className="sr-only">Loading community reports</span>
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-36 animate-pulse rounded-card bg-muted" />
              ))}
            </div>
          )}

          {feed !== null && shown.length === 0 && (
            <div className="rounded-card border border-dashed border-border px-4 py-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-[var(--accent-foreground)]">
                <Users size={20} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold">
                {filter === "all" ? "No reports yet" : "Nothing in this filter"}
              </p>
              <p className="mt-1 text-micro text-muted-foreground">
                {filter === "all"
                  ? "Be the first to check a ramp, lift or toilet near you."
                  : "Try another filter to see more reports."}
              </p>
            </div>
          )}

          {feed !== null && shown.length > 0 && (
            <ul className="space-y-3">
              {shown.map((report) => {
                const status = statuses[report.status]
                const StatusIcon = status.icon
                return (
                  <li key={report.id}>
                    <Card padded={false}>
                      <div className="flex items-center gap-3 p-4 pb-3">
                        {report.reporterPhoto ? (
                          <img
                            src={report.reporterPhoto}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-sm font-semibold text-primary">
                            {report.reporterName.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{report.reporterName}</p>
                          <button
                            type="button"
                            onClick={() => onOpenLocation(report.locationId)}
                            className="flex min-w-0 items-center gap-1 text-micro text-muted-foreground hover:text-primary hover:underline"
                          >
                            <MapPin size={11} aria-hidden="true" className="shrink-0" />
                            <span className="truncate">{report.locationName}</span>
                          </button>
                        </div>
                        <span className="shrink-0 text-micro text-muted-foreground">
                          {timeAgo(report.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
                        <Pill tone={conditionTones[report.condition]}>
                          {report.featureType.replace(/_/g, " ")}:{" "}
                          {conditionLabels[report.condition]}
                        </Pill>
                        <Pill tone={status.tone} icon={StatusIcon}>
                          {status.label}
                        </Pill>
                      </div>

                      <p className="px-4 pb-3 text-sm leading-relaxed">{report.summary}</p>

                      <div className="flex items-center gap-4 border-t border-border px-4 py-3 text-micro text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <ThumbsUp size={13} aria-hidden="true" />
                          {report.confirmed}
                          <span className="sr-only">people confirmed this</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ThumbsDown size={13} aria-hidden="true" />
                          {report.disputed}
                          <span className="sr-only">people disputed this</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenLocation(report.locationId)}
                          className="ml-auto font-semibold text-primary hover:underline"
                        >
                          Open on map
                        </button>
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
