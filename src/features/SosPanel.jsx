import { useEffect, useState } from "react"
import { HeartHandshake, MapPin, Navigation, Radio, ShieldCheck, XCircle } from "lucide-react"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Pill from "../ui/Pill"
import Spinner from "../ui/Spinner"
import { describeDistance, distanceKm } from "../distance"
import {
  acceptSos,
  cancelSos,
  clearHelper,
  isHelper,
  sendSos,
  setHelper,
  watchSos,
} from "../sos"

const situations = [
  "Trapped or broken lift",
  "Blocked wheelchair path",
  "Fallen, need physical help",
  "Other obstacle",
]

const mapsLink = (sos) => `https://www.google.com/maps/dir/?api=1&destination=${sos.lat},${sos.lng}`

function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

function ActiveSos({ sos, onDone }) {
  const [live, setLive] = useState(sos)
  const now = useNow()
  useEffect(() => watchSos(sos.id, setLive), [sos.id])
  const expiresAt = live.expiresAt?.toMillis?.() ?? sos.expiresAt
  const left = Math.max(0, Math.round((expiresAt - now) / 1000))
  const over = live.cancelled || left === 0

  return (
    <Card className="space-y-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <Pill tone={over ? "neutral" : "danger"} icon={Radio}>
          {over ? "SOS ended" : "SOS active"}
        </Pill>
        {!over && (
          <span className="font-mono text-sm font-bold">
            {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
          </span>
        )}
      </div>
      <p className="text-sm">
        {sos.alerted === 0
          ? "No helpers are within 2 km right now. Call emergency services if you are in danger."
          : `${sos.alerted} ${sos.alerted === 1 ? "helper" : "helpers"} within 2 km were alerted.`}
      </p>
      {live.helperName !== undefined && live.helperId && (
        <p className="flex items-center gap-2 rounded-control p-3 text-sm font-semibold" style={{ background: "var(--tone-success-surface)", color: "var(--tone-success-text)" }}>
          <HeartHandshake size={16} aria-hidden="true" />
          {live.helperName ?? "A helper"} is on the way.
        </p>
      )}
      {over ? (
        <Button variant="secondary" full onClick={onDone}>
          Back
        </Button>
      ) : (
        <Button variant="ghost" full onClick={() => cancelSos(sos.id)}>
          <XCircle size={16} aria-hidden="true" />
          Cancel SOS
        </Button>
      )}
    </Card>
  )
}

export function AlertCard({ sos, origin, userId }) {
  const accepted = sos.helperId === userId
  const taken = sos.helperId && !accepted
  return (
    <Card className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone="danger" icon={Radio}>{sos.situation}</Pill>
        {origin && <Pill tone="neutral">{describeDistance(distanceKm(origin, sos))}</Pill>}
      </div>
      <p className="text-sm font-semibold">{sos.requesterName ?? "Someone"} needs help</p>
      {sos.note && <p className="text-sm text-muted-foreground">{sos.note}</p>}
      <div className="flex gap-2">
        <Button full disabled={Boolean(sos.helperId)} onClick={() => acceptSos(sos.id)}>
          {accepted ? "You are on the way" : taken ? "Another helper is going" : "I'm on my way"}
        </Button>
        <Button as="a" variant="secondary" href={mapsLink(sos)} target="_blank" rel="noreferrer" aria-label="Open in Google Maps">
          <Navigation size={16} aria-hidden="true" />
        </Button>
      </div>
    </Card>
  )
}

export default function SosPanel({ origin, onLocate, locating, userId, alerts }) {
  const [situation, setSituation] = useState(situations[0])
  const [note, setNote] = useState("")
  const [active, setActive] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [helper, setHelperState] = useState(null)

  useEffect(() => {
    isHelper(userId).then(setHelperState).catch(() => setHelperState(false))
  }, [userId])

  async function broadcast() {
    if (!origin) {
      setError("Share your location first so helpers know where you are.")
      return
    }
    setBusy(true)
    setError("")
    try {
      setActive(await sendSos(situation, note, origin))
    } catch (failure) {
      setError(failure.message || "Could not send the SOS. Please try again.")
    }
    setBusy(false)
  }

  async function toggleHelper() {
    if (helper) {
      await clearHelper(userId)
      setHelperState(false)
      return
    }
    if (!origin) {
      setError("Share your location to become a helper.")
      return
    }
    await setHelper(userId, origin)
    setHelperState(true)
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission()
  }

  return (
    <div className="space-y-4">
      {alerts.length > 0 && (
        <section className="space-y-2" aria-label="SOS alerts near you">
          <h2 className="font-display text-lg font-bold">Someone near you needs help</h2>
          {alerts.map((sos) => (
            <AlertCard key={sos.id} sos={sos} origin={origin} userId={userId} />
          ))}
        </section>
      )}

      {active ? (
        <ActiveSos sos={active} onDone={() => setActive(null)} />
      ) : (
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
                Alerts helpers within 2 km for 10 minutes. Up to 3 alerts a day.
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
              maxLength={300}
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

          {error && (
            <p role="alert" className="text-sm" style={{ color: "var(--tone-danger-text)" }}>
              {error}
            </p>
          )}

          <Button variant="danger" size="lg" full onClick={broadcast} disabled={busy}>
            {busy ? <Spinner label="Sending SOS" size={18} /> : <Radio size={18} aria-hidden="true" />}
            {busy ? "Sending…" : "Broadcast SOS"}
          </Button>
        </Card>
      )}

      <Card className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">I can help nearby</h2>
          <p className="mt-1 text-micro text-muted-foreground">
            {helper
              ? "You will be alerted to SOS calls within 2 km of your shared location."
              : "Turn this on to be alerted when someone within 2 km needs help."}
          </p>
        </div>
        <Button variant={helper ? "quiet" : "primary"} onClick={toggleHelper} disabled={helper === null}>
          {helper ? "Turn off" : "Turn on"}
        </Button>
      </Card>
    </div>
  )
}
