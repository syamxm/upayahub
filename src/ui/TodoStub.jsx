import { Construction } from "lucide-react"

export default function TodoStub({ what, className = "" }) {
  return (
    <div
      role="note"
      className={`rounded-card border-2 border-dashed p-4 ${className}`}
      style={{
        background: "var(--tone-warning-surface)",
        borderColor: "var(--tone-warning-border)",
      }}
    >
      <p
        className="flex items-center gap-2 font-display text-sm font-bold"
        style={{ color: "var(--tone-warning-text)" }}
      >
        <Construction size={17} aria-hidden="true" />
        TODO: Add Backend Feature Later
      </p>
      <p className="mt-1.5 text-micro leading-relaxed" style={{ color: "var(--tone-warning-text)" }}>
        {what}
      </p>
    </div>
  )
}
