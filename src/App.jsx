import { useEffect, useState } from "react"
import { collection, getDocs, doc, getDoc, setDoc, deleteField } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { AlertCircle, Map, User, Users } from "lucide-react"
import { db, auth } from "./firebase"
import SignIn from "./SignIn"
import Leaderboard from "./Leaderboard"
import AccountMenu from "./AccountMenu"
import AppShell from "./ui/AppShell"
import MainNav from "./ui/MainNav"
import Spinner from "./ui/Spinner"
import ExploreScreen from "./screens/ExploreScreen"
import ProfileScreen from "./screens/ProfileScreen"
import ReportScreen from "./screens/ReportScreen"
import CommunityScreen from "./screens/CommunityScreen"
import { pointsPerReport } from "./submitReport"
import { matchesFilters } from "./conditions"

const tabs = [
  { id: "explore", label: "Explore", icon: Map },
  { id: "report", label: "Report", icon: AlertCircle, raised: true },
  { id: "community", label: "Community", icon: Users },
  { id: "profile", label: "Profile", icon: User },
]

export default function App() {
  const [locations, setLocations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [user, setUser] = useState(null)
  const [points, setPoints] = useState(0)
  const [reportCount, setReportCount] = useState(0)
  const [reportKey, setReportKey] = useState(0)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [filters, setFilters] = useState([])
  const [showAccount, setShowAccount] = useState(false)
  const [tab, setTab] = useState("explore")
  const [origin, setOrigin] = useState(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!user) return
    getDocs(collection(db, "locations")).then((snapshot) =>
      setLocations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    )
  }, [user])

  useEffect(() => {
    onAuthStateChanged(auth, async (account) => {
      setCheckingAuth(false)
      setUser(account)
      if (!account) return
      const profile = doc(db, "users", account.uid)
      await setDoc(
        profile,
        { name: account.displayName, photo: account.photoURL, email: deleteField() },
        { merge: true }
      )
      const saved = await getDoc(profile)
      setPoints(saved.data().points ?? 0)
      setReportCount(saved.data().reportCount ?? 0)
    })
  }, [])

  function applyReport(update, locationId) {
    setReportKey((current) => current + 1)
    if (update?.reportId) setPoints((current) => current + pointsPerReport)
    if (update?.reportId) setReportCount((current) => current + 1)
    if (!update?.field) return
    const target = locationId ?? selectedId
    setLocations((current) =>
      current.map((location) =>
        location.id === target
          ? {
              ...location,
              [update.field]: {
                condition: update.condition,
                confirmations: update.confirmations ?? 1,
                lastVerified: { seconds: Date.now() / 1000 },
              },
            }
          : location
      )
    )
  }

  function locate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function openLocation(locationId) {
    setSelectedId(locationId)
    setTab("explore")
  }

  function toggleFilter(key) {
    setFilters((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    )
  }

  if (checkingAuth) {
    return (
      <div className="grid h-dvh place-items-center bg-background">
        <Spinner label="Checking your sign-in" size={28} className="text-muted-foreground" />
      </div>
    )
  }

  if (!user) return <SignIn />

  const selected = locations.find((location) => location.id === selectedId)
  const visible = locations.filter((location) => matchesFilters(location, filters))

  return (
    <AppShell nav={<MainNav items={tabs} active={tab} onChange={setTab} />}>
      {tab === "explore" && (
        <ExploreScreen
          locations={locations}
          visible={visible}
          filters={filters}
          onToggleFilter={toggleFilter}
          selected={selected}
          onSelect={(location) => setSelectedId(location.id)}
          onClearSelection={() => setSelectedId(null)}
          userId={user.uid}
          reportKey={reportKey}
          onReported={applyReport}
          origin={origin}
          onLocate={locate}
          locating={locating}
        />
      )}

      {tab === "report" && (
        <ReportScreen
          locations={locations}
          userId={user.uid}
          onReported={applyReport}
          origin={origin}
          onLocate={locate}
          locating={locating}
        />
      )}

      {tab === "community" && <CommunityScreen onOpenLocation={openLocation} />}

      {tab === "profile" && (
        <ProfileScreen
          user={user}
          points={points}
          reportCount={reportCount}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenAccount={() => setShowAccount(true)}
        />
      )}

      {showAccount && (
        <AccountMenu
          user={user}
          points={points}
          reportCount={reportCount}
          onClose={() => setShowAccount(false)}
        />
      )}
      {showLeaderboard && (
        <Leaderboard userId={user.uid} onClose={() => setShowLeaderboard(false)} />
      )}
    </AppShell>
  )
}
