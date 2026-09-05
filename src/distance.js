const earthRadiusKm = 6371

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

export function distanceKm(from, to) {
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) ** 2
  return earthRadiusKm * 2 * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function describeDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m away`
  if (km < 10) return `${km.toFixed(1)} km away`
  return `${Math.round(km)} km away`
}

export function byDistanceFrom(origin) {
  return (a, b) => distanceKm(origin, a) - distanceKm(origin, b)
}
