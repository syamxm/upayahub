import { useState } from "react"
import { ChevronLeft, FileDown, Mail } from "lucide-react"
import LocationList from "../LocationList"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Pill from "../ui/Pill"
import TodoStub from "../ui/TodoStub"
import { conditionLabels, conditionTones, severity } from "../conditions"
import { loadReports } from "../votes"
import { csvFilename, downloadCsv, reportsToCsv } from "../exportReport"

function rank(reports) {
  return [...reports].sort(
    (a, b) =>
      severity[b.condition] - severity[a.condition] ||
      b.confirmed - a.confirmed ||
      (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  )
}

export default function CivicPanel({ locations, origin }) {
  const [chosenId, setChosenId] = useState(null)
  const [reports, setReports] = useState(null)
  const [error, setError] = useState("")
  const [emailAttempted, setEmailAttempted] = useState(false)

  const chosen = locations.find((location) => location.id === chosenId) ?? null

  async function choose(location) {
    setChosenId(location.id)
    setReports(null)
    setError("")
    setEmailAttempted(false)
    try {
      setReports(await loadReports(location.id))
    } catch {
      setError("Could not load reports for this place.")
    }
  }

  if (!chosen) {
    return (
      <div className="space-y-4">
        <Card>
          <h2 className="font-display text-lg font-bold">Escalate to the council</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Choose a place to see its reports ranked by severity, then download them as a
            spreadsheet you can send to the council yourself.
          </p>
        </Card>
        <LocationList
          locations={locations}
          selectedId={null}
          onSelect={choose}
          origin={origin}
          emptyMessage="No places are loaded yet."
        />
      </div>
    )
  }

  const ranked = reports ? rank(reports) : []

  return (
    <div className="space-y-4">
      <Button variant="secondary" onClick={() => setChosenId(null)}>
        <ChevronLeft size={16} aria-hidden="true" />
        Choose another place
      </Button>

      <Card>
        <h2 className="font-display text-lg font-bold">{chosen.name}</h2>
        <p className="text-micro text-muted-foreground">{chosen.category}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {reports === null
            ? "Loading reports"
            : `${reports.length} ${reports.length === 1 ? "report" : "reports"}, most serious first`}
        </p>
      </Card>

      {error && (
        <p role="alert" className="text-sm" style={{ color: "var(--tone-danger-text)" }}>
          {error}
        </p>
      )}

      {reports === null && !error && (
        <div className="space-y-2" aria-busy="true">
          <span className="sr-only">Loading reports</span>
          {[0, 1].map((row) => (
            <div key={row} className="h-20 animate-pulse rounded-card bg-muted" />
          ))}
        </div>
      )}

      {reports !== null && ranked.length === 0 && (
        <p className="rounded-card border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          There is nothing to escalate. No one has reported this place yet.
        </p>
      )}

      {ranked.length > 0 && (
        <>
          <ol className="space-y-2">
            {ranked.map((report, index) => (
              <li key={report.id}>
                <Card className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-muted text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill tone={conditionTones[report.condition]}>
                        {report.featureType.replace(/_/g, " ")}:{" "}
                        {conditionLabels[report.condition]}
                      </Pill>
                      <Pill tone="neutral">{report.confirmed} confirmed</Pill>
                      {report.disputed > 0 && (
                        <Pill tone="warning">{report.disputed} disputed</Pill>
                      )}
                    </div>
                    <p className="mt-2 text-sm">{report.summary}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ol>

          <Button
            full
            onClick={() => downloadCsv(csvFilename(chosen), reportsToCsv(chosen, ranked))}
          >
            <FileDown size={16} aria-hidden="true" />
            Download report as CSV
          </Button>

          <Button variant="secondary" full onClick={() => setEmailAttempted(true)}>
            <Mail size={16} aria-hidden="true" />
            Send officially to the council
          </Button>

          {emailAttempted && (
            <div aria-live="polite">
              <TodoStub what="Nothing was sent. Emailing the council needs a backend that can deliver mail, keep an audit trail and track the reference number. The CSV download above is real and works today, so you can send it yourself in the meantime." />
            </div>
          )}
        </>
      )}
    </div>
  )
}
