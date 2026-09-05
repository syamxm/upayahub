import { severity } from "./conditions.js"

const headers = [
  "Location",
  "Latitude",
  "Longitude",
  "Feature",
  "Condition",
  "Summary",
  "Confirmations",
  "Disputes",
  "Reported at",
]

function escapeCell(value) {
  const text = String(value ?? "")
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

function reportedAt(createdAt) {
  return createdAt ? new Date(createdAt.seconds * 1000).toISOString() : ""
}

export function reportsToCsv(location, reports) {
  const rows = [...reports]
    .sort(
      (a, b) =>
        severity[b.condition] - severity[a.condition] || b.confirmed - a.confirmed
    )
    .map((report) => [
      location.name,
      location.lat,
      location.lng,
      report.featureType.replace("_", " "),
      report.condition,
      report.summary,
      report.confirmed,
      report.disputed,
      reportedAt(report.createdAt),
    ])

  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n")
}

export function downloadCsv(filename, csv) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function csvFilename(location) {
  const slug = location.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return `upayahub-${slug}-${new Date().toISOString().slice(0, 10)}.csv`
}
