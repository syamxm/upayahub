import { useState } from "react"
import { verifyPhoto } from "./verifyPhoto"

export default function PhotoVerifier() {
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState("")

  async function handleFile(event) {
    const file = event.target.files[0]
    if (!file) return
    setResult(null)
    setStatus("Checking photo...")
    try {
      setResult(await verifyPhoto(file))
      setStatus("")
    } catch (error) {
      setStatus(error.message)
    }
  }

  return (
    <div className="border-t border-slate-200 pt-3 space-y-2">
      <input type="file" accept="image/*" onChange={handleFile} className="text-sm" />
      {status && <p className="text-sm text-slate-500">{status}</p>}
      {result && (
        <>
          {result.looksSynthetic && (
            <p className="text-sm bg-amber-100 text-amber-900 rounded px-3 py-2">
              Possibly AI generated ({Math.round(result.syntheticConfidence * 100)}%) —{" "}
              {result.syntheticReason}
            </p>
          )}
          <dl className="text-sm text-slate-700 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="font-medium">Feature</dt>
            <dd>{result.featureType}</dd>
            <dt className="font-medium">Condition</dt>
            <dd>{result.condition}</dd>
            <dt className="font-medium">Confidence</dt>
            <dd>{Math.round(result.confidence * 100)}%</dd>
            <dt className="font-medium">Summary</dt>
            <dd>{result.summary}</dd>
          </dl>
        </>
      )}
    </div>
  )
}
