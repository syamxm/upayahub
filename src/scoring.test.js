import { test } from "node:test"
import assert from "node:assert/strict"
import { accessibilityScore, scoreBand } from "./conditions.js"
import { distanceKm, describeDistance } from "./distance.js"
import { displayReporter } from "./reporter.js"

const fresh = { seconds: Date.now() / 1000 }

function place(features) {
  return Object.fromEntries(
    Object.entries(features).map(([key, condition]) => [
      key,
      { condition, confirmations: 2, lastVerified: fresh },
    ])
  )
}

test("score is null when nothing has been verified", () => {
  assert.equal(accessibilityScore({}), null)
  assert.equal(accessibilityScore(place({ ramp: "unclear" })), null)
})

test("score averages only the features that have a condition", () => {
  assert.equal(accessibilityScore(place({ ramp: "usable" })), 100)
  assert.equal(accessibilityScore(place({ ramp: "blocked" })), 0)
  assert.equal(accessibilityScore(place({ ramp: "usable", elevator: "blocked" })), 50)
  assert.equal(accessibilityScore(place({ ramp: "usable", elevator: "damaged" })), 75)
})

test("unclear features are excluded rather than counted as zero", () => {
  const withUnclear = place({ ramp: "usable", elevator: "unclear" })
  assert.equal(accessibilityScore(withUnclear), 100)
})

test("score bands match the pill tones", () => {
  assert.equal(scoreBand(null), "unrated")
  assert.equal(scoreBand(100), "good")
  assert.equal(scoreBand(80), "good")
  assert.equal(scoreBand(79), "mixed")
  assert.equal(scoreBand(50), "mixed")
  assert.equal(scoreBand(49), "poor")
  assert.equal(scoreBand(0), "poor")
})

test("distance between two known Kuala Lumpur points is plausible", () => {
  const klcc = { lat: 3.1578, lng: 101.7117 }
  const merdeka = { lat: 3.1478, lng: 101.6953 }
  const km = distanceKm(klcc, merdeka)
  assert.ok(km > 1.9 && km < 2.3, `expected about 2 km, got ${km.toFixed(2)}`)
  assert.equal(distanceKm(klcc, klcc), 0)
})

test("distance is described in readable units", () => {
  assert.equal(describeDistance(0.4), "400 m away")
  assert.equal(describeDistance(2.34), "2.3 km away")
  assert.equal(describeDistance(18.6), "19 km away")
})

test("reporter name falls back for reports written before it was stored", () => {
  assert.deepEqual(displayReporter({ reporterId: "abc" }), {
    reporterName: "Someone",
    reporterPhoto: null,
  })
})

test("reporter photo is dropped once the name has been redacted", () => {
  assert.deepEqual(displayReporter({ reporterPhoto: "https://example.test/a.jpg" }), {
    reporterName: "Someone",
    reporterPhoto: null,
  })
})

test("a stored reporter name and photo are used as written", () => {
  assert.deepEqual(
    displayReporter({ reporterName: "Nurul", reporterPhoto: "https://example.test/n.jpg" }),
    { reporterName: "Nurul", reporterPhoto: "https://example.test/n.jpg" }
  )
})

test("a stored name without a photo is still shown", () => {
  assert.deepEqual(displayReporter({ reporterName: "Nurul" }), {
    reporterName: "Nurul",
    reporterPhoto: null,
  })
})
