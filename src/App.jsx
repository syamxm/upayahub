import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "./firebase"
import AccessibilityMap from "./AccessibilityMap"
import LocationDetails from "./LocationDetails"
import MapLegend from "./MapLegend"

export default function App() {
  const [locations, setLocations] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    getDocs(collection(db, "locations")).then((snapshot) =>
      setLocations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    )
  }, [])

  function applyReport({ field, condition }) {
    setLocations((current) =>
      current.map((location) =>
        location.id === selectedId ? { ...location, [field]: condition } : location
      )
    )
  }

  const selected = locations.find((location) => location.id === selectedId)

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 bg-emerald-600 text-white">
        <h1 className="text-xl font-bold">UpayaHub</h1>
        <p className="text-sm text-emerald-50">Know Before You Go.</p>
      </header>
      <main className="flex-1 relative">
        <AccessibilityMap locations={locations} onSelect={(location) => setSelectedId(location.id)} />
        <MapLegend />
        {selected && (
          <LocationDetails
            location={selected}
            onClose={() => setSelectedId(null)}
            onReported={applyReport}
          />
        )}
      </main>
    </div>
  )
}
