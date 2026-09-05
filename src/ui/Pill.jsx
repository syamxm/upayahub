const tones = ["neutral", "info", "success", "warning", "danger"]

export default function Pill({ tone = "neutral", icon: Icon, children, className = "" }) {
  const name = tones.includes(tone) ? tone : "neutral"
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-micro font-semibold ${className}`}
      style={{
        background: `var(--tone-${name}-surface)`,
        borderColor: `var(--tone-${name}-border)`,
        color: `var(--tone-${name}-text)`,
      }}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  )
}
