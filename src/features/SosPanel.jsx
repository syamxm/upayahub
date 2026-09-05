import { useState } from "react"
import { HeartHandshake, MapPin, Radio, ShieldCheck } from "lucide-react"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Pill from "../ui/Pill"
import Spinner from "../ui/Spinner"
import TodoStub from "../ui/TodoStub"

const situations = [
  "Trapped or broken lift",
  "Blocked wheelchair path",
  "Fallen, need physical help",
  "Other obstacle",
]

export default function SosPanel({ origin, onLocate, locating }) {
  const [situation, setSituation] = useState(situations[0])
  const [note, setNote] = useState("")
  const [broadcastAttempted, setBroadcastAttempted] = useState(false)

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Pill tone="info" icon={ShieldCheck}>
              Safety check
            </Pill>
            <h2 className="mt-3 font-display text-xl font-bold tracking-tight">
              Need urgent accessibility help?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              This would alert nearby helpers, volunteers and caregivers within 2 km.
            </p>
          </div>
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-hero bg-accent text-[var(--accent-foreground)] sm:grid">
            <HeartHandshake size={22} aria-hidden="true" />
          </span>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold">What is happening?</legend>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {situations.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-2.5 rounded-control border px-3 py-3 text-sm font-semibold transition-colors ${
                  situation === option
                    ? "border-primary bg-accent text-[var(--accent-foreground)]"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name="situation"
                  value={option}
                  checked={situation === option}
                  onChange={() => setSituation(option)}
                  className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="sos-note" className="text-sm font-semibold">
            Add a note (optional)
          </label>
          <textarea
            id="sos-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Where exactly are you, and what would help?"
            className="w-full resize-none rounded-control border border-border bg-[var(--input)] p-3 text-sm placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-muted p-3">
          <span className="flex items-center gap-2 text-micro font-semibold">
            <MapPin size={15} aria-hidden="true" className="text-primary" />
            {origin
              ? `Your location: ${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`
              : "Your location is not shared yet"}
          </span>
          <Button variant="secondary" onClick={onLocate} disabled={locating}>
            {locating && <Spinner label="Finding your location" size={15} />}
            {origin ? "Update" : "Share location"}
          </Button>
        </div>

        <Button
          variant="danger"
          size="lg"
          full
          onClick={() => setBroadcastAttempted(true)}
          aria-describedby={broadcastAttempted ? "sos-stub" : undefined}
        >
          <Radio size={18} aria-hidden="true" />
          Broadcast SOS
        </Button>
      </Card>

      {broadcastAttempted && (
        <div id="sos-stub" aria-live="polite">
          <TodoStub what="Nothing was sent. Broadcasting an SOS needs a backend that can find nearby helpers, notify them, and track who is responding. None of that exists yet, so this button does not contact anyone." />
        </div>
      )}

      <TodoStub what="The helper side of this feature, where a nearby volunteer accepts and navigates to you, also needs that backend before it can be built." />
    </div>
  )
}
