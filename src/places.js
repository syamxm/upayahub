import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore"
import { db } from "./db"

// Coordinates are approximate; adjust in the Firestore console if a pin looks off.
const preset = (condition) => ({ condition, confirmations: 0, lastVerified: null })

export const cyberjayaPlaces = [
  {
    name: "Multimedia University (MMU)",
    category: "University",
    lat: 2.9276,
    lng: 101.6416,
    ramp: preset("usable"),
    elevator: preset("usable"),
    tactilePaving: preset("usable"),
    accessibleToilet: preset("usable"),
  },
  {
    name: "Shaftsbury Square",
    category: "Shopping mall",
    lat: 2.9236,
    lng: 101.6396,
    ramp: preset("usable"),
    elevator: preset("damaged"),
    tactilePaving: preset("unclear"),
    accessibleToilet: preset("usable"),
  },
  {
    name: "DPulze Shopping Centre",
    category: "Shopping mall",
    lat: 2.9202,
    lng: 101.6588,
    ramp: preset("usable"),
    elevator: preset("usable"),
    tactilePaving: preset("damaged"),
    accessibleToilet: preset("usable"),
  },
  {
    name: "Cyberjaya Lake Park",
    category: "Park",
    lat: 2.9315,
    lng: 101.6486,
    ramp: preset("damaged"),
    elevator: preset("unclear"),
    tactilePaving: preset("blocked"),
    accessibleToilet: preset("damaged"),
  },
  {
    name: "Masjid Raja Haji Fi Sabilillah",
    category: "Place of worship",
    lat: 2.9283,
    lng: 101.6492,
    ramp: preset("usable"),
    elevator: preset("unclear"),
    tactilePaving: preset("unclear"),
    accessibleToilet: preset("usable"),
  },
]

// ponytail: single batch, fine under 500 docs total. Chunk if the prototype outgrows that.
export async function resetPlaces() {
  const batch = writeBatch(db)
  for (const name of ["locations", "reports", "votes", "reportPhotos"]) {
    const found = await getDocs(collection(db, name))
    found.docs.forEach((entry) => batch.delete(entry.ref))
  }
  cyberjayaPlaces.forEach((place) =>
    batch.set(doc(collection(db, "locations")), { ...place, createdAt: serverTimestamp() })
  )
  await batch.commit()
  return cyberjayaPlaces.length
}
