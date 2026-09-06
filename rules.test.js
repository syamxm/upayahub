import { test, before, after, beforeEach } from "node:test"
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing"
import { readFileSync } from "node:fs"
import { doc, setDoc, updateDoc, getDoc, deleteDoc, deleteField, serverTimestamp, increment, writeBatch } from "firebase/firestore"

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
  await assertFails(setDoc(doc(as(alice), "reports/f9"), report({ featureType: "none", field: null })))
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

test("pending clears only alongside the location update that promotes it", async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), "reports/r1"), { pending: true })
  })
  await assertFails(updateDoc(doc(as(bob), "reports/r1"), { pending: false }))

  const bobDb = as(bob)
  const batch = writeBatch(bobDb)
  batch.update(doc(bobDb, "locations/loc1"), {
    ramp: { condition: "usable", confirmations: 2, lastVerified: serverTimestamp(), sourceReportId: "r1" },
  })
  batch.update(doc(bobDb, "reports/r1"), { pending: false })
  await assertSucceeds(batch.commit())
})

const admin = () =>
  env.authenticatedContext("admin", { email: "admin_upayahub@upayahub.app" }).firestore()

const voucher = { partner: "Kopi", title: "RM5 off", description: "d", cost: 30, createdAt: serverTimestamp() }

test("only the admin resets places, reports and votes", async () => {
  await assertFails(setDoc(doc(as(alice), "locations/new"), { name: "X", lat: 2.9, lng: 101.6 }))
  await assertFails(deleteDoc(doc(as(alice), "locations/loc1")))
  await assertSucceeds(setDoc(doc(admin(), "locations/new"), { name: "X", lat: 2.9, lng: 101.6 }))
  await assertSucceeds(deleteDoc(doc(admin(), "locations/loc1")))
  await assertSucceeds(deleteDoc(doc(admin(), "reports/r1")))
})

test("report photo is written by the report owner only", async () => {
  const photo = { reporterId: alice, data: "data:image/jpeg;base64,xx", createdAt: serverTimestamp() }
  await assertSucceeds(setDoc(doc(as(alice), "reportPhotos/r1"), photo))
  await assertFails(setDoc(doc(as(bob), "reportPhotos/r1"), { ...photo, reporterId: bob }))
  await assertFails(setDoc(doc(as(alice), "reportPhotos/ghost"), photo))
  await assertSucceeds(getDoc(doc(as(bob), "reportPhotos/r1")))
  await assertFails(deleteDoc(doc(as(alice), "reportPhotos/r1")))
  await assertSucceeds(setDoc(doc(as(alice), "reports/p1"), report({ hasPhoto: true })))
})

test("only the admin account manages vouchers", async () => {
  await assertFails(setDoc(doc(as(alice), "vouchers/v1"), voucher))
  await assertSucceeds(setDoc(doc(admin(), "vouchers/v1"), voucher))
  await assertFails(setDoc(doc(admin(), "vouchers/v2"), { ...voucher, cost: 0 }))
  await assertFails(setDoc(doc(admin(), "vouchers/v3"), { ...voucher, cost: 1.5 }))
  await assertSucceeds(getDoc(doc(as(alice), "vouchers/v1")))
  await assertFails(deleteDoc(doc(as(alice), "vouchers/v1")))
  await assertSucceeds(deleteDoc(doc(admin(), "vouchers/v1")))
})

test("redeeming a voucher spends exactly its cost in one batch", async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, "vouchers/v1"), { ...voucher, createdAt: new Date() })
    await setDoc(doc(db, "users/alice"), { name: "Alice", points: 50, reportCount: 5 })
  })
  const redemption = (overrides = {}) => ({
    voucherId: "v1", partner: "Kopi", title: "RM5 off", code: "UH-ABC123", cost: 30,
    createdAt: serverTimestamp(), ...overrides,
  })
  const spend = (db, uid, id, extra = {}) => {
    const batch = writeBatch(db)
    batch.set(doc(db, `users/${uid}/redemptions/${id}`), redemption(extra))
    batch.update(doc(db, `users/${uid}`), { points: increment(-30), lastRedemptionId: id })
    return batch.commit()
  }

  // redemption without the points deduction
  await assertFails(setDoc(doc(as(alice), "users/alice/redemptions/x"), redemption()))
  // deduction without the redemption
  await assertFails(updateDoc(doc(as(alice), "users/alice"), { points: increment(-30), lastRedemptionId: "x" }))
  // lying about the cost
  await assertFails(spend(as(alice), alice, "x", { cost: 1 }))
  // someone else's wallet
  await assertFails(spend(as(bob), alice, "x"))

  await assertSucceeds(spend(as(alice), alice, "x"))
  // same redemption id again, and then not enough points
  await assertFails(spend(as(alice), alice, "x"))
  await assertFails(spend(as(alice), alice, "y"))
})

test("helpers doc is owner-only with sane coordinates", async () => {
  await assertSucceeds(setDoc(doc(as(alice), "helpers/alice"), { lat: 3.1, lng: 101.7, updatedAt: serverTimestamp() }))
  await assertFails(setDoc(doc(as(alice), "helpers/alice"), { lat: 300, lng: 101.7, updatedAt: serverTimestamp() }))
  await assertFails(setDoc(doc(as(bob), "helpers/alice"), { lat: 3.1, lng: 101.7, updatedAt: serverTimestamp() }))
  await assertFails(getDoc(doc(as(bob), "helpers/alice")))
  await assertSucceeds(deleteDoc(doc(as(alice), "helpers/alice")))
})

test("sos is visible only to requester and alerted helpers, accepted once, cancelled by owner", async () => {
  const sos = {
    requesterId: alice, requesterName: "Alice", situation: "Fallen, need physical help", note: "",
    lat: 3.1, lng: 101.7, alertedIds: [bob], helperId: null, helperName: null, cancelled: false,
    createdAt: new Date(), expiresAt: new Date(Date.now() + 600000),
  }
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, "sos/s1"), sos)
    await setDoc(doc(db, "sos/s2"), { ...sos, expiresAt: new Date(Date.now() - 1000) })
  })
  const carol = env.authenticatedContext("carol").firestore()

  await assertFails(setDoc(doc(as(alice), "sos/forged"), sos))
  await assertSucceeds(getDoc(doc(as(alice), "sos/s1")))
  await assertSucceeds(getDoc(doc(as(bob), "sos/s1")))
  await assertFails(getDoc(doc(carol, "sos/s1")))

  await assertFails(updateDoc(doc(carol, "sos/s1"), { helperId: "carol", helperName: "Carol" }))
  await assertFails(updateDoc(doc(as(bob), "sos/s1"), { helperId: alice, helperName: "Bob" }))
  await assertFails(updateDoc(doc(as(bob), "sos/s2"), { helperId: bob, helperName: "Bob" }))
  await assertSucceeds(updateDoc(doc(as(bob), "sos/s1"), { helperId: bob, helperName: "Bob" }))
  await assertFails(updateDoc(doc(as(bob), "sos/s1"), { helperId: bob, helperName: "Bob again" }))

  await assertFails(updateDoc(doc(as(bob), "sos/s1"), { cancelled: true }))
  await assertFails(updateDoc(doc(as(alice), "sos/s1"), { note: "edited" }))
  await assertSucceeds(updateDoc(doc(as(alice), "sos/s1"), { cancelled: true }))
  await assertFails(deleteDoc(doc(as(alice), "sos/s1")))
})
