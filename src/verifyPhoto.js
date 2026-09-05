import { GoogleGenAI, Type } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

const schema = {
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

const instruction = `You are inspecting a photo submitted to an accessibility reporting app.

First, identify whether it shows an accessibility feature and what condition it is in.

Second, judge whether the image is a real camera photograph or synthetic, meaning AI generated,
rendered, or heavily manipulated. Look for warped or nonsensical text on signage, implausible
geometry in railings and structures, malformed hands or wheelchair parts, repeated textures,
unnaturally even lighting, and missing camera artefacts such as sensor noise and chromatic
aberration. State the single strongest piece of evidence in syntheticReason.

Set both confidence values between 0 and 1. Keep summary and syntheticReason under 20 words each.`

function toBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(",")[1])
    reader.readAsDataURL(file)
  })
}

export async function verifyPhoto(file) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [
      {
        parts: [
          { inlineData: { mimeType: file.type, data: await toBase64(file) } },
          { text: instruction },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseSchema: schema },
  })

  return JSON.parse(response.text)
}
