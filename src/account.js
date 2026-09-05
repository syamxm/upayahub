import { deleteUser, reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { db } from "./firebase"

export async function deleteAccount(user) {
  await reauthenticateWithPopup(user, new GoogleAuthProvider())
  await deleteDoc(doc(db, "users", user.uid))
  await deleteUser(user)
}
