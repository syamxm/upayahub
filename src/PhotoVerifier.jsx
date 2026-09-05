import { useRef, useState } from "react"
import { AlertTriangle, Camera, Sparkles } from "lucide-react"
import Button from "./ui/Button"
import Pill from "./ui/Pill"
import Spinner from "./ui/Spinner"
import { conditionLabels, conditionTones } from "./conditions"
import { verifyPhoto } from "./verifyPhoto"
import { submitReport } from "./submitReport"

export default function PhotoVerifier({ location, userId, onReported }) {
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const input = useRef(null)

  async function handleFile(event) {
    const file = event.target.files[0]
    if (!file) return
    setResult(null)
    setError("")
    setStatus("Checking your photo")
    setBusy(true)
    try {
      setResult(await verifyPhoto(file))
      setStatus("")
    } catch (failure) {
      setError(failure.message)
      setStatus("")
    }
    setBusy(false)
  }

  async function handleSubmit() {
    setStatus("Saving your report")
    setError("")
    setBusy(true)
    try {
      const update = await submitReport(location, result, userId)
      onReported(update, location.id)
      setResult(null)
      if (update?.applied) setStatus("Report saved and the map is updated.")
      else if (update?.pending)
        setStatus("Report saved. One more person needs to confirm it before the map changes.")
      else setStatus("Report saved and sent for review.")
      if (input.current) input.current.value = ""
    } catch (failure) {
      setError(failure.message)
      setStatus("")
    }
    setBusy(false)
  }

  const confidence = result ? Math.round(result.confidence * 100) : 0

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Add photo evidence</h3>
        <p className="mt-1 text-micro text-muted-foreground">
          A clear photo lets us check what is there right now and keeps the map fresh.
        </p>
      </div>

      <label className="tap flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed border-border px-4 py-5 text-center transition-colors hover:bg-muted focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[var(--ring)]">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-[var(--accent-foreground)]">
          <Camera size={20} aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold">Take or choose a photo</span>
        <span className="text-micro text-muted-foreground">JPEG or PNG</span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={busy}
          className="sr-only"
        />
      </label>

      {status && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          {busy && <Spinner label={status} size={16} />}
          {status}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-control border p-3 text-sm"
          style={{
            background: "var(--tone-danger-surface)",
            borderColor: "var(--tone-danger-border)",
            color: "var(--tone-danger-text)",
          }}
        >
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3 rounded-control border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} aria-hidden="true" className="text-primary" />
            <h4 className="text-sm font-semibold">What we found in your photo</h4>
          </div>

          {result.looksSynthetic && (
            <p
              className="flex items-start gap-2 rounded-control border p-3 text-micro"
              style={{
                background: "var(--tone-warning-surface)",
                borderColor: "var(--tone-warning-border)",
                color: "var(--tone-warning-text)",
              }}
            >
              <AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
              This may not be a real photograph ({Math.round(result.syntheticConfidence * 100)}%
              likely). {result.syntheticReason} It will be sent for review.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="info">{result.featureType.replace(/_/g, " ")}</Pill>
            <Pill tone={conditionTones[result.condition]}>
              {conditionLabels[result.condition]}
            </Pill>
          </div>

          <div>
            <div className="flex items-center justify-between text-micro">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-semibold">{confidence}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={confidence}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Photo check confidence"
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{result.summary}</p>

          <Button onClick={handleSubmit} disabled={busy} full>
            Submit report
          </Button>
        </div>
      )}
    </div>
  )
}
