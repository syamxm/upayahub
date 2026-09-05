import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { db } from "./db"
import { displayReporter } from "./reporter"

export const feedSize = 50

function chunk(items, size) {
  const groups = []
  for (let at = 0; at < items.length; at += size) groups.push(items.slice(at, at + size))
  return groups
}

export function reportStatus(report) {
  if (report.needsReview) return "flagged"
  if (report.pending) return "awaiting"
  return "onMap"
}

async function loadVotesFor(reportIds) {
  const groups = await Promise.all(
    chunk(reportIds, 30).map((group) =>
      getDocs(query(collection(db, "votes"), where("reportId", "in", group)))
    )
  )
  return groups.flatMap((group) => group.docs.map((entry) => entry.data()))
}

export async function loadFeed() {
  const found = await getDocs(
    query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(feedSize))
  )
  const reports = found.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
  if (reports.length === 0) return []

  const votes = await loadVotesFor(reports.map((report) => report.id))

  return reports.map((report) => {
    const own = votes.filter((vote) => vote.reportId === report.id)
    return {
      ...report,
      ...displayReporter(report),
      status: reportStatus(report),
      confirmed: own.filter((vote) => vote.value === 1).length,
      disputed: own.filter((vote) => vote.value === -1).length,
      voters: own.map((vote) => vote.voterId),
    }
  })
}

export async function loadCommunityStats() {
  const weekAgo = Timestamp.fromMillis(Date.now() - 7 * 86400000)
  const [thisWeek, contributors, places] = await Promise.all([
    getCountFromServer(query(collection(db, "reports"), where("createdAt", ">=", weekAgo))),
    getCountFromServer(collection(db, "users")),
    getCountFromServer(collection(db, "locations")),
  ])
  return {
    thisWeek: thisWeek.data().count,
    contributors: contributors.data().count,
    places: places.data().count,
  }
}
