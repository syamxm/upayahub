import { scoreBand } from "../conditions"

const tones = { good: "success", mixed: "warning", poor: "danger", unrated: "neutral" }

export default function ScoreBadge({ score }) {
  const band = scoreBand(score)
  const label =
    score === null ? "Not rated yet" : `Accessibility score ${score} out of 100`

  return (
    <span
      title={label}
      className="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-micro font-bold"
      style={{
        background: `var(--tone-${tones[band]}-surface)`,
        borderColor: `var(--tone-${tones[band]}-border)`,
        color: `var(--tone-${tones[band]}-text)`,
      }}
    >
      <span aria-hidden="true">{score === null ? "--" : score}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
