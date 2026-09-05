import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

export function voteId(reportId, userId) {
  return `${reportId}_${userId}`
}

export async function loadReports(locationId) {
  const found = await getDocs(
    query(collection(db, "reports"), where("locationId", "==", locationId))
  )
  const reports = found.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    .slice(0, 10)

  if (reports.length === 0) return []

  const votes = await getDocs(
    query(
      collection(db, "votes"),
      where(
        "reportId",
        "in",
        reports.map((report) => report.id)
      )
    )
  )

  return reports.map((report) => {
    const own = votes.docs.filter((entry) => entry.data().reportId === report.id)
    return {
      ...report,
      confirmed: own.filter((entry) => entry.data().value === 1).length,
      disputed: own.filter((entry) => entry.data().value === -1).length,
      voters: own.map((entry) => entry.data().voterId),
    }
  })
}

export async function castVote(reportId, userId, value) {
  await setDoc(doc(db, "votes", voteId(reportId, userId)), {
    reportId,
    voterId: userId,
    value,
    createdAt: serverTimestamp(),
  })
}
