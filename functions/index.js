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

const emailInstruction = `You draft a formal complaint email from UpayaHub, a community accessibility map, to
Jabatan Kerja Raya (JKR) Malaysia about accessibility defects at one location. Use the ranked
report list given as JSON. Be polite, specific and short: one opening paragraph, a bullet per
defect (feature, condition, how many people confirmed it), and a closing request for inspection
and a reference number. Mention that a CSV of the reports is attached. Do not invent facts not
in the data. Sign off as "UpayaHub community". Plain text, no markdown.`

const emailSchema = {
  type: Type.OBJECT,
  properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } },
  required: ["subject", "body"],
}

function readEscalation(data) {
  const name = typeof data?.location?.name === "string" ? data.location.name.slice(0, 200) : ""
  const reports = Array.isArray(data?.reports) ? data.reports.slice(0, 30) : []
  if (!name || reports.length === 0) {
    throw new HttpsError("invalid-argument", "Location name and at least one report are required.")
  }
  return {
    location: { name, category: String(data.location.category ?? "").slice(0, 100) },
    reports: reports.map((report) => ({
      feature: String(report.feature ?? "").slice(0, 40),
      condition: String(report.condition ?? "").slice(0, 20),
      summary: String(report.summary ?? "").slice(0, 300),
      confirmed: Number(report.confirmed) || 0,
      disputed: Number(report.disputed) || 0,
    })),
  }
}

export const draftCouncilEmail = onCall(
  { secrets: [geminiApiKey], cors: allowedOrigins, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign in to draft an email.")

    const escalation = readEscalation(request.data)
    await enforceRateLimit(request.auth.uid)

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() })
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [{ parts: [{ text: emailInstruction }, { text: JSON.stringify(escalation) }] }],
        config: { responseMimeType: "application/json", responseSchema: emailSchema },
      })
      return JSON.parse(response.text)
    } catch (error) {
      console.error("gemini email draft failed", error)
      throw new HttpsError("internal", "Could not draft the email. Please try again.")
    }
  }
)

// ---- SOS ----

const sosRadiusKm = 2
const sosDurationMs = 10 * 60 * 1000
const sosPerDay = 3
const helperStaleMs = 24 * 60 * 60 * 1000
const situations = [
  "Trapped or broken lift",
  "Blocked wheelchair path",
  "Fallen, need physical help",
  "Other obstacle",
]

function distanceKm(from, to) {
  const rad = (deg) => (deg * Math.PI) / 180
  const a =
    Math.sin(rad(to.lat - from.lat) / 2) ** 2 +
    Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(rad(to.lng - from.lng) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)))
}

function readSos(data) {
  const lat = Number(data?.lat)
  const lng = Number(data?.lng)
  if (!situations.includes(data?.situation)) {
    throw new HttpsError("invalid-argument", "Pick what is happening.")
  }
  if (!(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)) {
    throw new HttpsError("invalid-argument", "Share your location before sending an SOS.")
  }
  return { situation: data.situation, note: String(data.note ?? "").slice(0, 300), lat, lng }
}

// ponytail: day boundary is UTC, not Malaysia time. Switch to Asia/Kuala_Lumpur if anyone notices.
async function enforceSosLimit(uid) {
  const limitDoc = getFirestore().collection("sosLimits").doc(uid)
  const today = new Date().toISOString().slice(0, 10)
  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(limitDoc)
    const count = snapshot.get("day") === today ? (snapshot.get("count") ?? 0) : 0
    if (count >= sosPerDay) {
      throw new HttpsError("resource-exhausted", `You can send ${sosPerDay} SOS alerts a day.`)
    }
    transaction.set(limitDoc, { day: today, count: count + 1 })
  })
}

export const sendSos = onCall({ cors: allowedOrigins, enforceAppCheck: false }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in to send an SOS.")

  const sos = readSos(request.data)
  await enforceSosLimit(request.auth.uid)

  // ponytail: full scan of helpers. Geohash range query once helpers outnumber a few thousand.
  const helpers = await getFirestore().collection("helpers").get()
  const cutoff = Date.now() - helperStaleMs
  const alertedIds = helpers.docs
    .filter(
      (helper) =>
        helper.id !== request.auth.uid &&
        (helper.get("updatedAt")?.toMillis() ?? 0) > cutoff &&
        distanceKm(sos, { lat: helper.get("lat"), lng: helper.get("lng") }) <= sosRadiusKm
    )
    .map((helper) => helper.id)

  const expiresAt = new Date(Date.now() + sosDurationMs)
  const created = await getFirestore().collection("sos").add({
    ...sos,
    requesterId: request.auth.uid,
    requesterName: request.auth.token.name ?? null,
    alertedIds,
    helperId: null,
    helperName: null,
    cancelled: false,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
  })

  return { id: created.id, alerted: alertedIds.length, expiresAt: expiresAt.getTime() }
})
