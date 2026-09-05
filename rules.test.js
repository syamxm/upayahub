import { test, before, after, beforeEach } from "node:test"
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing"
import { readFileSync } from "node:fs"
import { doc, setDoc, updateDoc, getDoc, deleteDoc, deleteField, serverTimestamp, increment } from "firebase/firestore"

let env

const alice = "alice"
const bob = "bob"

const report = (overrides = {}) => ({
  locationId: "loc1",
  locationName: "KLCC",
  reporterId: alice,
  reporterName: "Alice",
  reporterPhoto: null,
  featureType: "ramp",
  field: "ramp",
  condition: "usable",
  confidence: 0.9,
  summary: "Ramp is clear",
  looksSynthetic: false,
  syntheticConfidence: 0.1,
  needsReview: false,
  pending: false,
  createdAt: serverTimestamp(),
  ...overrides,
})

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "upayahub-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  })
})

after(async () => env?.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, "locations/loc1"), { name: "KLCC", lat: 3.1, lng: 101.7 })
    await setDoc(doc(db, "users/alice"), { name: "Alice", points: 0, reportCount: 0 })
    await setDoc(doc(db, "users/bob"), { name: "Bob", points: 0, reportCount: 0 })
    await setDoc(doc(db, "reports/r1"), { ...report(), createdAt: new Date() })
  })
})

const as = (uid) => env.authenticatedContext(uid).firestore()
const anon = () => env.unauthenticatedContext().firestore()

test("signed out is denied everywhere", async () => {
  await assertFails(getDoc(doc(anon(), "locations/loc1")))
  await assertFails(getDoc(doc(anon(), "reports/r1")))
  await assertFails(setDoc(doc(anon(), "reports/x"), report()))
})

test("signed in can read core collections", async () => {
  await assertSucceeds(getDoc(doc(as(alice), "locations/loc1")))
  await assertSucceeds(getDoc(doc(as(alice), "reports/r1")))
  await assertSucceeds(getDoc(doc(as(alice), "users/bob")))
})

test("valid report create succeeds", async () => {
  await assertSucceeds(setDoc(doc(as(alice), "reports/new1"), report()))
})

test("report create rejects forgery and bad values", async () => {
  await assertFails(setDoc(doc(as(bob), "reports/f1"), report()))
  await assertFails(setDoc(doc(as(alice), "reports/f2"), report({ locationId: "ghost" })))
  await assertFails(setDoc(doc(as(alice), "reports/f3"), report({ condition: "great" })))
  await assertFails(setDoc(doc(as(alice), "reports/f4"), report({ confidence: 5 })))
  await assertFails(setDoc(doc(as(alice), "reports/f5"), report({ confidence: 0.1 })))
  await assertFails(setDoc(doc(as(alice), "reports/f6"), report({ looksSynthetic: true })))
  await assertFails(setDoc(doc(as(alice), "reports/f7"), report({ isAdmin: true })))
  await assertFails(setDoc(doc(as(alice), "reports/f8"), report({ createdAt: new Date() })))
})

test("reports cannot be deleted or rewritten", async () => {
  await assertFails(deleteDoc(doc(as(alice), "reports/r1")))
  await assertFails(updateDoc(doc(as(alice), "reports/r1"), { condition: "blocked" }))
})

test("owner may redact own identity, others may not", async () => {
  await assertFails(
    updateDoc(doc(as(bob), "reports/r1"), {
      reporterName: deleteField(),
      reporterPhoto: deleteField(),
    })
  )
  await assertSucceeds(
    updateDoc(doc(as(alice), "reports/r1"), {
      reporterName: deleteField(),
      reporterPhoto: deleteField(),
    })
  )
})

test("photoCheckLimits is closed to clients", async () => {
  await assertFails(getDoc(doc(as(alice), "photoCheckLimits/alice")))
  await assertFails(setDoc(doc(as(alice), "photoCheckLimits/alice"), { count: 0 }))
})

test("unknown collections are closed", async () => {
  await assertFails(setDoc(doc(as(alice), "admins/alice"), { role: "root" }))
  await assertFails(getDoc(doc(as(alice), "secrets/key")))
})

test("cannot vote on own report, can vote on another's", async () => {
  await assertFails(
    setDoc(doc(as(alice), "votes/r1_alice"), {
      reportId: "r1", voterId: alice, value: 1, createdAt: serverTimestamp(),
    })
  )
  await assertSucceeds(
    setDoc(doc(as(bob), "votes/r1_bob"), {
      reportId: "r1", voterId: bob, value: 1, createdAt: serverTimestamp(),
    })
  )
})

test("votes are immutable and cannot be forged", async () => {
  await assertFails(
    setDoc(doc(as(bob), "votes/r1_alice"), {
      reportId: "r1", voterId: alice, value: 1, createdAt: serverTimestamp(),
    })
  )
  await assertFails(
    setDoc(doc(as(bob), "votes/r1_bob"), {
      reportId: "r1", voterId: bob, value: 99, createdAt: serverTimestamp(),
    })
  )
  await setDoc(doc(as(bob), "votes/r1_bob"), {
    reportId: "r1", voterId: bob, value: 1, createdAt: serverTimestamp(),
  })
  await assertFails(updateDoc(doc(as(bob), "votes/r1_bob"), { value: -1 }))
  await assertFails(deleteDoc(doc(as(bob), "votes/r1_bob")))
})

test("profile sync is allowed, points are not editable through it", async () => {
  await assertSucceeds(
    setDoc(doc(as(alice), "users/alice"), { name: "Alice A", photo: "u" }, { merge: true })
  )
  await assertFails(updateDoc(doc(as(alice), "users/alice"), { points: 9999 }))
  await assertFails(updateDoc(doc(as(alice), "users/alice"), { points: increment(10) }))
})

test("points require a fresh report the caller owns", async () => {
  await assertSucceeds(
    updateDoc(doc(as(alice), "users/alice"), {
      points: increment(10), reportCount: increment(1), lastReportId: "r1",
    })
  )

  await assertFails(
    updateDoc(doc(as(alice), "users/alice"), {
      points: increment(10), reportCount: increment(1), lastReportId: "r1",
    })
  )

  await assertFails(
    updateDoc(doc(as(bob), "users/bob"), {
      points: increment(10), reportCount: increment(1), lastReportId: "r1",
    })
  )

  await assertFails(
    updateDoc(doc(as(alice), "users/alice"), {
      points: increment(100), reportCount: increment(1), lastReportId: "r1",
    })
  )
})

test("cannot write another user's doc", async () => {
  await assertFails(updateDoc(doc(as(bob), "users/alice"), { name: "hacked" }))
  await assertFails(deleteDoc(doc(as(bob), "users/alice")))
  await assertSucceeds(deleteDoc(doc(as(alice), "users/alice")))
})

test("locations only change with a backing report", async () => {
  await assertFails(updateDoc(doc(as(alice), "locations/loc1"), { name: "Renamed" }))
  await assertFails(
    updateDoc(doc(as(alice), "locations/loc1"), {
      ramp: { condition: "usable", confirmations: 1, lastVerified: serverTimestamp(), sourceReportId: "ghost" },
    })
  )
  await assertFails(
    updateDoc(doc(as(alice), "locations/loc1"), {
      ramp: { condition: "blocked", confirmations: 1, lastVerified: serverTimestamp(), sourceReportId: "r1" },
    })
  )
  await assertSucceeds(
    updateDoc(doc(as(alice), "locations/loc1"), {
      ramp: { condition: "usable", confirmations: 1, lastVerified: serverTimestamp(), sourceReportId: "r1" },
    })
  )
})
