import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import { app, auth } from "./firebase"
import { db } from "./db"

const send = httpsCallable(getFunctions(app, "asia-southeast1"), "sendSos")

export async function sendSos(situation, note, origin) {
  const response = await send({ situation, note, lat: origin.lat, lng: origin.lng })
  return response.data
}

export const cancelSos = (id) => updateDoc(doc(db, "sos", id), { cancelled: true })

export function acceptSos(id) {
  return updateDoc(doc(db, "sos", id), {
    helperId: auth.currentUser.uid,
    helperName: auth.currentUser.displayName ?? null,
  })
}

export const watchSos = (id, onChange) =>
  onSnapshot(doc(db, "sos", id), (snapshot) => onChange({ id, ...snapshot.data() }))

const isLive = (sos) => !sos.cancelled && sos.expiresAt?.toMillis() > Date.now()

export function watchAlerts(userId, onChange) {
  // ponytail: expiry filtered client-side; a server-side range would need a composite index.
  const alerts = query(collection(db, "sos"), where("alertedIds", "array-contains", userId))
  return onSnapshot(alerts, (snapshot) =>
    onChange(
      snapshot.docs
        .map((entry) => ({ id: entry.id, ...entry.data() }))
        .filter(isLive)
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
    )
  )
}

export async function isHelper(userId) {
  return (await getDoc(doc(db, "helpers", userId))).exists()
}

export function setHelper(userId, origin) {
  return setDoc(doc(db, "helpers", userId), { ...origin, updatedAt: serverTimestamp() })
}

export const clearHelper = (userId) => deleteDoc(doc(db, "helpers", userId))
