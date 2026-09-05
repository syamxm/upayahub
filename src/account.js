import { deleteUser, reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth"
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore"
import { db } from "./db"

async function redactReports(userId) {
  const own = await getDocs(query(collection(db, "reports"), where("reporterId", "==", userId)))
  if (own.empty) return

  const batch = writeBatch(db)
  own.docs.forEach((report) =>
    batch.update(report.ref, { reporterName: deleteField(), reporterPhoto: deleteField() })
  )
  await batch.commit()
}

export async function deleteAccount(user) {
  await reauthenticateWithPopup(user, new GoogleAuthProvider())
  await redactReports(user.uid)
  await deleteDoc(doc(db, "users", user.uid))
  await deleteUser(user)
}
