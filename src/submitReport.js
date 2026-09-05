import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

const featureFields = {
  ramp: "ramp",
  elevator: "elevator",
  tactile_paving: "tactilePaving",
  accessible_toilet: "accessibleToilet",
}

export async function submitReport(location, result) {
  const field = featureFields[result.featureType]

  await addDoc(collection(db, "reports"), {
    locationId: location.id,
    locationName: location.name,
    featureType: result.featureType,
    condition: result.condition,
    confidence: result.confidence,
    summary: result.summary,
    looksSynthetic: result.looksSynthetic,
    syntheticConfidence: result.syntheticConfidence,
    needsReview: result.looksSynthetic || result.confidence < 0.6,
    createdAt: serverTimestamp(),
  })

  if (!field) return null

  await updateDoc(doc(db, "locations", location.id), { [field]: result.condition })
  return { field, condition: result.condition }
}
