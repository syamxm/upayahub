import { HttpsError } from "firebase-functions/v2/https"

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"]
const maxImageBytes = 4 * 1024 * 1024

export function decodedByteLength(base64) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

export function readImage(data) {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Send an image to check.")
  }

  const { mimeType, data: base64 } = data

  if (!allowedMimeTypes.includes(mimeType)) {
    throw new HttpsError("invalid-argument", "Use a JPEG, PNG or WebP photo.")
  }

  if (typeof base64 !== "string" || !/^[A-Za-z0-9+/]+=*$/.test(base64)) {
    throw new HttpsError("invalid-argument", "That image could not be read.")
  }

  if (decodedByteLength(base64) > maxImageBytes) {
    throw new HttpsError("invalid-argument", "That photo is too large. Use one under 4 MB.")
  }

  return { mimeType, base64 }
}
