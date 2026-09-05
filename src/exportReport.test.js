import { test } from "node:test"
import assert from "node:assert/strict"
import { reportsToCsv, csvFilename } from "./exportReport.js"

const location = { name: 'DPULZE "Linkway"', lat: 3.1562, lng: 101.6115 }

const reports = [
  { featureType: "accessible_toilet", condition: "usable", summary: "Fine", confirmed: 9, disputed: 0, createdAt: { seconds: 0 } },
  { featureType: "elevator", condition: "blocked", summary: "=cmd|calc", confirmed: 2, disputed: 1, createdAt: null },
  { featureType: "ramp", condition: "blocked", summary: 'Bins, "again"', confirmed: 5, disputed: 0, createdAt: { seconds: 0 } },
]

test("ranks by severity then confirmations", () => {
  const lines = reportsToCsv(location, reports).split("\r\n")
  assert.match(lines[1], /ramp/)
  assert.match(lines[2], /elevator/)
  assert.match(lines[3], /accessible toilet/)
})

test("neutralises formula injection and quotes", () => {
  const csv = reportsToCsv(location, reports)
  assert.match(csv, /"'=cmd\|calc"/)
  assert.match(csv, /"Bins, ""again"""/)
  assert.match(csv, /"DPULZE ""Linkway"""/)
})

test("blank timestamp when the write is still pending", () => {
  assert.match(reportsToCsv(location, [reports[1]]).split("\r\n")[1], /,""$/)
})

test("filename slugifies", () => {
  assert.match(csvFilename(location), /^upayahub-dpulze-linkway-\d{4}-\d{2}-\d{2}\.csv$/)
})
