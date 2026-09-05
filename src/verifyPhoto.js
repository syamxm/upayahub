import { getFunctions, httpsCallable } from "firebase/functions"
import { app } from "./firebase"

const checkPhoto = httpsCallable(getFunctions(app, "asia-southeast1"), "checkPhoto")

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(",")[1])
    reader.onerror = () => reject(new Error("Could not read that file."))
    reader.readAsDataURL(file)
  })
}

export async function verifyPhoto(file) {
  const data = await toBase64(file)
  const response = await checkPhoto({ mimeType: file.type, data })
  return response.data
}
