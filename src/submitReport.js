import { collection, addDoc, doc, updateDoc, setDoc, increment, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"
import { featureState, isUpgrade } from "./conditions"

const featureFields = {
  ramp: "ramp",
  elevator: "elevator",
  tactile_paving: "tactilePaving",
  accessible_toilet: "accessibleToilet",
}

export const pointsPerReport = 10

export async function submitReport(location, result, userId) {
  const field = featureFields[result.featureType]
  const needsReview = result.looksSynthetic || result.confidence < 0.6
  const current = field ? featureState(location, field).condition : null
  const heldForConfirmation =
    field !== undefined && !needsReview && isUpgrade(current, result.condition)

  const report = await addDoc(collection(db, "reports"), {
    locationId: location.id,
    locationName: location.name,
    reporterId: userId,
    featureType: result.featureType,
    field: field ?? null,
    condition: result.condition,
    confidence: result.confidence,
    summary: result.summary,
    looksSynthetic: result.looksSynthetic,
    syntheticConfidence: result.syntheticConfidence,
    needsReview,
    pending: heldForConfirmation,
    createdAt: serverTimestamp(),
  })

  await setDoc(
    doc(db, "users", userId),
    { points: increment(pointsPerReport), reportCount: increment(1) },
    { merge: true }
  )

  if (!field || needsReview || heldForConfirmation) {
    return { reportId: report.id, applied: false, pending: heldForConfirmation }
  }

  await updateDoc(doc(db, "locations", location.id), {
    [field]: { condition: result.condition, confirmations: 1, lastVerified: serverTimestamp() },
  })

  return { reportId: report.id, applied: true, field, condition: result.condition }
}
