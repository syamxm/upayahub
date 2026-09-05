export const conditionColors = {
  blocked: "#dc2626",
  damaged: "#d97706",
  usable: "#059669",
  unclear: "#64748b",
  none: "#64748b",
}

export const conditionTones = {
  blocked: "danger",
  damaged: "warning",
  usable: "success",
  unclear: "neutral",
  none: "neutral",
}

export const conditionLabels = {
  blocked: "Blocked",
  damaged: "Needs repair",
  usable: "Fully usable",
  unclear: "Unverified",
  none: "Unverified",
}

export const severity = { blocked: 3, damaged: 2, unclear: 1, none: 1, usable: 0 }

export const trackedFeatures = ["ramp", "elevator", "tactilePaving", "accessibleToilet"]

export const confirmationsRequired = 2

export const freshnessDays = 30

const emptyState = { condition: "unclear", confirmations: 0, lastVerified: null }

export function featureState(location, key) {
  const raw = location[key]
  if (!raw) return { ...emptyState, stale: false, confirmed: false }

  const stored = typeof raw === "string" ? { condition: raw, confirmations: 1 } : raw

  const verifiedAt = stored.lastVerified ? stored.lastVerified.seconds * 1000 : null
  const stale = verifiedAt !== null && Date.now() - verifiedAt > freshnessDays * 86400000

  return {
    condition: stored.condition,
    confirmations: stored.confirmations ?? 1,
    lastVerified: verifiedAt,
    stale,
    confirmed: (stored.confirmations ?? 1) >= confirmationsRequired && !stale,
  }
}

export function isUpgrade(current, next) {
  return severity[next] < severity[current]
}

export function worstCondition(location) {
  return trackedFeatures.reduce((worst, key) => {
    const { condition } = featureState(location, key)
    return severity[condition] > severity[worst] ? condition : worst
  }, "usable")
}

export function pinIcon(condition) {
  const color = conditionColors[condition]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10 14 24 14 24s14-14 14-24c0-7.7-6.3-14-14-14z" fill="${color}"/>
    <circle cx="14" cy="14" r="5.5" fill="#ffffff"/>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function describeAge(lastVerified) {
  if (!lastVerified) return "never verified"
  const days = Math.floor((Date.now() - lastVerified) / 86400000)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days} days ago`
  const months = Math.round(days / 30)
  return months === 1 ? "a month ago" : `${months} months ago`
}

export const featureLabels = {
  ramp: "Step-free / ramp",
  elevator: "Working elevator",
  tactilePaving: "Tactile paving",
  accessibleToilet: "Accessible toilet",
}

export function matchesFilters(location, required) {
  return required.every((key) => featureState(location, key).condition === "usable")
}
