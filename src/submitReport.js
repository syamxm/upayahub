import { collection, addDoc, doc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore"
import { auth } from "./firebase"
import { db } from "./db"
import { featureState, isUpgrade, pointsPerReport } from "./conditions"

const featureFields = {
  ramp: "ramp",
  elevator: "elevator",
  tactile_paving: "tactilePaving",
  accessible_toilet: "accessibleToilet",
}

export async function submitReport(location, result, userId, photo) {
  const field = featureFields[result.featureType]
  const needsReview = result.looksSynthetic || result.confidence < 0.6
  const current = field ? featureState(location, field).condition : null
  const heldForConfirmation =
    field !== undefined && !needsReview && isUpgrade(current, result.condition)

  const reporter = auth.currentUser
  const report = await addDoc(collection(db, "reports"), {
    locationId: location.id,
    locationName: location.name,
    reporterId: userId,
    reporterName: reporter?.displayName ?? null,
    reporterPhoto: reporter?.photoURL ?? null,
    featureType: result.featureType,
    field: field ?? null,
    condition: result.condition,
    confidence: result.confidence,
    summary: result.summary,
    looksSynthetic: result.looksSynthetic,
    syntheticConfidence: result.syntheticConfidence,
    needsReview,
    pending: heldForConfirmation,
    hasPhoto: true,
    createdAt: serverTimestamp(),
  })

  await setDoc(doc(db, "reportPhotos", report.id), {
    reporterId: userId,
    data: photo,
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(db, "users", userId), {
    points: increment(pointsPerReport),
    reportCount: increment(1),
    lastReportId: report.id,
  })

  if (!field || needsReview || heldForConfirmation) {
    return { reportId: report.id, applied: false, pending: heldForConfirmation }
  }

  await updateDoc(doc(db, "locations", location.id), {
    [field]: {
      condition: result.condition,
      confirmations: 1,
      lastVerified: serverTimestamp(),
      sourceReportId: report.id,
    },
  })

  return { reportId: report.id, applied: true, field, condition: result.condition }
}
