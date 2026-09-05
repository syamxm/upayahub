import { collection, deleteField, doc, getDoc, getDocs, setDoc } from "firebase/firestore"
import { db } from "./db"

export async function syncProfile(account) {
  const profile = doc(db, "users", account.uid)
  await setDoc(
    profile,
    { name: account.displayName, photo: account.photoURL, email: deleteField() },
    { merge: true }
  )
  const saved = await getDoc(profile)
  return {
    points: saved.data()?.points ?? 0,
    reportCount: saved.data()?.reportCount ?? 0,
  }
}

export async function loadLocations() {
  const snapshot = await getDocs(collection(db, "locations"))
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
}
