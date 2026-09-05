import { lazy, Suspense, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { AlertCircle, Map, User, Users } from "lucide-react"
import { auth } from "./firebase"
import SignIn from "./SignIn"
import AppShell from "./ui/AppShell"
import MainNav from "./ui/MainNav"
import Spinner from "./ui/Spinner"
import ScreenLoading from "./ui/ScreenLoading"

const Leaderboard = lazy(() => import("./Leaderboard"))
const AccountMenu = lazy(() => import("./AccountMenu"))
const ExploreScreen = lazy(() => import("./screens/ExploreScreen"))
const ProfileScreen = lazy(() => import("./screens/ProfileScreen"))
const ReportScreen = lazy(() => import("./screens/ReportScreen"))
const CommunityScreen = lazy(() => import("./screens/CommunityScreen"))
const FeaturesScreen = lazy(() => import("./screens/FeaturesScreen"))
import { matchesFilters, pointsPerReport } from "./conditions"

const tabs = [
  { id: "explore", label: "Explore", icon: Map },
  { id: "report", label: "Report", icon: AlertCircle, raised: true },
  { id: "community", label: "Community", icon: Users },
  { id: "profile", label: "Profile", icon: User },
]

export default function App() {
  const [locations, setLocations] = useState([])
  const [locationsStatus, setLocationsStatus] = useState("loading")
  const [reloadKey, setReloadKey] = useState(0)
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
  const [showFeatures, setShowFeatures] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    import("./session")
      .then(({ loadLocations }) => loadLocations())
      .then((loaded) => {
        if (!active) return
        setLocations(loaded)
        setLocationsStatus("ready")
      })
      .catch(() => {
        if (active) setLocationsStatus("error")
      })
    return () => {
      active = false
    }
  }, [user, reloadKey])

  useEffect(() => {
    onAuthStateChanged(auth, async (account) => {
      setCheckingAuth(false)
      setUser(account)
      if (!account) return
      const { syncProfile } = await import("./session")
      const profile = await syncProfile(account)
      setPoints(profile.points)
      setReportCount(profile.reportCount)
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

  function reloadLocations() {
    setLocationsStatus("loading")
    setReloadKey((current) => current + 1)
  }

  function openTab(next) {
    setShowFeatures(false)
    setTab(next)
  }

  function openLocation(locationId) {
    setShowFeatures(false)
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

  if (showFeatures) {
    return (
      <AppShell nav={<MainNav items={tabs} active={tab} onChange={openTab} />}>
        <Suspense fallback={<ScreenLoading label="Loading community tools" />}>
          <FeaturesScreen
          onBack={() => setShowFeatures(false)}
          locations={locations}
          points={points}
          reportCount={reportCount}
          origin={origin}
            onLocate={locate}
            locating={locating}
          />
        </Suspense>
      </AppShell>
    )
  }

  return (
    <AppShell nav={<MainNav items={tabs} active={tab} onChange={openTab} />}>
      <Suspense fallback={<ScreenLoading label="Loading" />}>
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
            onOpenFeatures={() => setShowFeatures(true)}
            status={locationsStatus}
            onRetry={reloadLocations}
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
            status={locationsStatus}
            onRetry={reloadLocations}
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
      </Suspense>

      <Suspense fallback={null}>
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
      </Suspense>
    </AppShell>
  )
}
