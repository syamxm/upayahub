import { collection, getDocs } from "firebase/firestore"
import { db } from "./firebase"

export async function loadLeaderboard() {
  const [users, reports, votes] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "reports")),
    getDocs(collection(db, "votes")),
  ])

  const reporterOf = {}
  reports.docs.forEach((report) => {
    reporterOf[report.id] = report.data().reporterId
  })

  const tally = {}
  votes.docs.forEach((vote) => {
    const { reportId, value } = vote.data()
    const reporterId = reporterOf[reportId]
    if (!reporterId) return
    tally[reporterId] = tally[reporterId] ?? { confirmed: 0, disputed: 0 }
    if (value === 1) tally[reporterId].confirmed += 1
    else tally[reporterId].disputed += 1
  })

  return users.docs
    .map((user) => {
      const data = user.data()
      const counts = tally[user.id] ?? { confirmed: 0, disputed: 0 }
      const total = counts.confirmed + counts.disputed
      return {
        id: user.id,
        name: data.name ?? "Anonymous",
        photo: data.photo,
        points: data.points ?? 0,
        reportCount: data.reportCount ?? 0,
        credibility: total === 0 ? null : Math.round((counts.confirmed / total) * 100),
        votesReceived: total,
      }
    })
    .sort((a, b) => b.points - a.points)
}
