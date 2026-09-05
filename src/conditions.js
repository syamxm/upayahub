export const conditionColors = {
  blocked: "#dc2626",
  damaged: "#d97706",
  usable: "#059669",
  unclear: "#64748b",
  none: "#64748b",
}

const severity = { blocked: 3, damaged: 2, unclear: 1, none: 1, usable: 0 }

const trackedFeatures = ["ramp", "elevator", "tactilePaving", "accessibleToilet"]

export function worstCondition(location) {
  return trackedFeatures.reduce((worst, key) => {
    const value = location[key]
    return severity[value] > severity[worst] ? value : worst
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
