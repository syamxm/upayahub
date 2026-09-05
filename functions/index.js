import { initializeApp } from "firebase-admin/app"
import { getFirestore, FieldValue } from "firebase-admin/firestore"
import { onCall, HttpsError } from "firebase-functions/v2/https"
import { defineSecret } from "firebase-functions/params"
import { setGlobalOptions } from "firebase-functions/v2"
import { GoogleGenAI, Type } from "@google/genai"
import { readImage } from "./validation.js"

const geminiApiKey = defineSecret("GEMINI_API_KEY")

initializeApp()
setGlobalOptions({ region: "asia-southeast1", maxInstances: 10 })

const allowedOrigins = [
  "https://upayahub.syamxm.com",
  "http://localhost:5173",
  "http://localhost:4173",
]

const rateLimitWindowMs = 60 * 60 * 1000
const rateLimitMaxCalls = 20

const instruction = `You are inspecting a photo submitted to an accessibility reporting app.

First, identify whether it shows an accessibility feature and what condition it is in.

Second, judge whether the image is a real camera photograph or synthetic, meaning AI generated,
rendered, or heavily manipulated. Look for warped or nonsensical text on signage, implausible
geometry in railings and structures, malformed hands or wheelchair parts, repeated textures,
unnaturally even lighting, and missing camera artefacts such as sensor noise and chromatic
aberration. State the single strongest piece of evidence in syntheticReason.

Set both confidence values between 0 and 1. Keep summary and syntheticReason under 20 words each.`

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isAccessibilityFeature: { type: Type.BOOLEAN },
    featureType: {
      type: Type.STRING,
      enum: ["ramp", "elevator", "tactile_paving", "accessible_toilet", "parking", "none"],
    },
    condition: { type: Type.STRING, enum: ["usable", "damaged", "blocked", "unclear"] },
    confidence: { type: Type.NUMBER },
    looksSynthetic: { type: Type.BOOLEAN },
    syntheticConfidence: { type: Type.NUMBER },
    syntheticReason: { type: Type.STRING },
    summary: { type: Type.STRING },
  },
  required: [
    "isAccessibilityFeature",
    "featureType",
    "condition",
    "confidence",
    "looksSynthetic",
    "syntheticConfidence",
    "syntheticReason",
    "summary",
  ],
}

async function enforceRateLimit(uid) {
  const limitDoc = getFirestore().collection("photoCheckLimits").doc(uid)

  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(limitDoc)
    const now = Date.now()
    const windowStart = snapshot.get("windowStart")?.toMillis() ?? 0
    const withinWindow = now - windowStart < rateLimitWindowMs
    const count = withinWindow ? (snapshot.get("count") ?? 0) : 0

    if (count >= rateLimitMaxCalls) {
      throw new HttpsError("resource-exhausted", "Too many photo checks. Try again later.")
    }

    transaction.set(limitDoc, {
      count: count + 1,
      windowStart: withinWindow ? snapshot.get("windowStart") : FieldValue.serverTimestamp(),
    })
  })
}

export const checkPhoto = onCall(
  { secrets: [geminiApiKey], cors: allowedOrigins, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in to check a photo.")
    }

    const { mimeType, base64 } = readImage(request.data)
    await enforceRateLimit(request.auth.uid)

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() })

    let response
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [
          {
            parts: [{ inlineData: { mimeType, data: base64 } }, { text: instruction }],
          },
        ],
        config: { responseMimeType: "application/json", responseSchema },
      })
    } catch (error) {
      console.error("gemini request failed", error)
      throw new HttpsError("internal", "Could not check that photo. Please try again.")
    }

    try {
      return JSON.parse(response.text)
    } catch (error) {
      console.error("gemini returned unparsable json", error)
      throw new HttpsError("internal", "Could not check that photo. Please try again.")
    }
  }
)
