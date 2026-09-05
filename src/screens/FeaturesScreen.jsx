import { useState } from "react"
import { Award, Mail, Radio } from "lucide-react"
import CivicPanel from "../features/CivicPanel"
import RewardsPanel from "../features/RewardsPanel"
import SosPanel from "../features/SosPanel"
import ScreenHeader from "../ui/ScreenHeader"

const panels = [
  { id: "sos", label: "SOS and assist", icon: Radio },
  { id: "civic", label: "Civic dispatch", icon: Mail },
  { id: "rewards", label: "Rewards", icon: Award },
]

export default function FeaturesScreen({
  onBack,
  locations,
  points,
  reportCount,
  origin,
  onLocate,
  locating,
}) {
  const [panel, setPanel] = useState("sos")

  return (
    <>
      <ScreenHeader
        title="Community tools"
        subtitle="Emergency help, council escalation and rewards"
        onBack={onBack}
        backLabel="Back to UpayaHub"
      />

      <div className="shrink-0 bg-header px-4 pb-4">
        <div
          role="tablist"
          aria-label="Community tools"
          className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-2"
        >
          {panels.map(({ id, label, icon: Icon }) => {
            const isActive = panel === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setPanel(id)}
                className={`tap flex flex-col items-center justify-center gap-1 rounded-control px-2 py-2.5 text-micro font-bold transition-colors ${
                  isActive
                    ? "bg-card text-primary"
                    : "bg-[var(--header-surface)] text-[var(--header-foreground)]"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          {panel === "sos" && (
            <SosPanel origin={origin} onLocate={onLocate} locating={locating} />
          )}
          {panel === "civic" && <CivicPanel locations={locations} origin={origin} />}
          {panel === "rewards" && <RewardsPanel points={points} reportCount={reportCount} />}
        </div>
      </div>
    </>
  )
}
