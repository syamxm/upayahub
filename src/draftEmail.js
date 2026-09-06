import { getFunctions, httpsCallable } from "firebase/functions"
import { app } from "./firebase"

const draft = httpsCallable(getFunctions(app, "asia-southeast1"), "draftCouncilEmail")

export async function draftCouncilEmail(location, reports) {
  const response = await draft({
    location: { name: location.name, category: location.category },
    reports: reports.map((report) => ({
      feature: report.featureType.replace(/_/g, " "),
      condition: report.condition,
      summary: report.summary,
      confirmed: report.confirmed,
      disputed: report.disputed,
    })),
  })
  return response.data
}
