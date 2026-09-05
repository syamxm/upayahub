import { collection, addDoc, doc, updateDoc, setDoc, increment, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

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

  await addDoc(collection(db, "reports"), {
    locationId: location.id,
    locationName: location.name,
    reporterId: userId,
    featureType: result.featureType,
    condition: result.condition,
    confidence: result.confidence,
    summary: result.summary,
    looksSynthetic: result.looksSynthetic,
    syntheticConfidence: result.syntheticConfidence,
    needsReview,
    createdAt: serverTimestamp(),
  })

  await setDoc(
    doc(db, "users", userId),
    { points: increment(pointsPerReport), reportCount: increment(1) },
    { merge: true }
  )

  if (!field) return null

  await updateDoc(doc(db, "locations", location.id), { [field]: result.condition })
  return { field, condition: result.condition }
}
