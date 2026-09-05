import { useEffect, useState } from "react"
import { Award } from "lucide-react"
import Modal from "./ui/Modal"
import { loadLeaderboard } from "./leaderboard"

function Rank({ position }) {
  return (
    <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">
      {position}
    </span>
  )
}

export default function Leaderboard({ userId, onClose }) {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    let active = true
    loadLeaderboard().then((loaded) => {
      if (active) setEntries(loaded)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <Modal title="Top contributors" onClose={onClose}>
      {entries === null ? (
        <div className="space-y-2 p-4" aria-busy="true">
          <span className="sr-only">Loading contributors</span>
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-14 animate-pulse rounded-control bg-muted" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No contributors yet. Be the first to report a place.
        </p>
      ) : (
        <ol className="divide-y divide-border">
          {entries.map((entry, index) => {
            const isYou = entry.id === userId
            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 px-4 py-3 ${isYou ? "bg-accent" : ""}`}
              >
                <Rank position={index + 1} />
                {entry.photo ? (
                  <img
                    src={entry.photo}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-sm font-semibold text-primary">
                    {entry.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.name}
                    {isYou && <span className="ml-1 text-primary">(you)</span>}
                  </p>
                  <p className="text-micro text-muted-foreground">
                    {entry.reportCount} {entry.reportCount === 1 ? "report" : "reports"}
                    {entry.credibility !== null &&
                      `, ${entry.credibility}% confirmed by ${entry.votesReceived}`}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                  <Award size={15} aria-hidden="true" />
                  {entry.points}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </Modal>
  )
}
