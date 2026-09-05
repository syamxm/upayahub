import { useState } from "react"
import { verifyPhoto } from "./verifyPhoto"
import { submitReport } from "./submitReport"

export default function PhotoVerifier({ location, userId, onReported }) {
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

  async function handleSubmit() {
    setStatus("Saving report...")
    try {
      const update = await submitReport(location, result, userId)
      onReported(update)
      setResult(null)
      setStatus(update ? "Report saved" : "Saved for review, no feature matched")
    } catch (error) {
      setStatus(error.message)
    }
  }

  return (
    <div className="border-t border-slate-200 pt-3 space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-semibold file:text-emerald-700"
      />
      {status && <p className="text-sm text-slate-500">{status}</p>}
      {result && (
        <>
          {result.looksSynthetic && (
            <p className="rounded-2xl bg-amber-100 px-3 py-2 text-sm text-amber-900">
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
          <button
            onClick={handleSubmit}
            className="w-full rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            Submit report
          </button>
        </>
      )}
    </div>
  )
}
