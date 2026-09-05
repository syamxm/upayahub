import { useEffect, useState } from "react"
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Award } from "lucide-react"
import { db, auth } from "./firebase"
import AccessibilityMap from "./AccessibilityMap"
import LocationDetails from "./LocationDetails"
import MapLegend from "./MapLegend"
import SignIn from "./SignIn"
import Avatar from "./Avatar"
import { pointsPerReport } from "./submitReport"

export default function App() {
  const [locations, setLocations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [user, setUser] = useState(null)
  const [points, setPoints] = useState(0)
  const [reportKey, setReportKey] = useState(0)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    getDocs(collection(db, "locations")).then((snapshot) =>
      setLocations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    )
  }, [])

  useEffect(() => {
    onAuthStateChanged(auth, async (account) => {
      setCheckingAuth(false)
      setUser(account)
      if (!account) return
      const profile = doc(db, "users", account.uid)
      await setDoc(
        profile,
        { name: account.displayName, photo: account.photoURL, email: account.email },
        { merge: true }
      )
      const saved = await getDoc(profile)
      setPoints(saved.data().points ?? 0)
    })
  }, [])

  function applyReport(update) {
    setPoints((current) => current + pointsPerReport)
    setReportKey((current) => current + 1)
    if (!update) return
    setLocations((current) =>
      current.map((location) =>
        location.id === selectedId ? { ...location, [update.field]: update.condition } : location
      )
    )
  }

  if (checkingAuth) return <div className="h-screen bg-slate-50" />
  if (!user) return <SignIn />

  const selected = locations.find((location) => location.id === selectedId)

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 bg-emerald-600 text-white flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">UpayaHub</h1>
          <p className="text-sm text-emerald-50">Know Before You Go.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-700 rounded-full px-3 py-1.5 shrink-0">
            <Award size={16} />
            <span className="font-semibold text-sm">{points}</span>
          </div>
          <Avatar user={user} />
        </div>
      </header>
      <main className="flex-1 relative">
        <AccessibilityMap locations={locations} onSelect={(location) => setSelectedId(location.id)} />
        <MapLegend />
        {selected && (
          <LocationDetails
            location={selected}
            userId={user.uid}
            reportKey={reportKey}
            onClose={() => setSelectedId(null)}
            onReported={applyReport}
          />
        )}
      </main>
    </div>
  )
}
