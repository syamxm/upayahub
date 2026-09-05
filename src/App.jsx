import { useState } from "react"
import AccessibilityMap from "./AccessibilityMap"
import LocationDetails from "./LocationDetails"

export default function App() {
  const [selected, setSelected] = useState(null)

  function applyReport({ field, condition }) {
    setSelected((current) => ({ ...current, [field]: condition }))
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 bg-emerald-600 text-white">
        <h1 className="text-xl font-bold">UpayaHub</h1>
        <p className="text-sm text-emerald-50">Know Before You Go.</p>
      </header>
      <main className="flex-1 relative">
        <AccessibilityMap onSelect={setSelected} />
        {selected && (
          <LocationDetails
            location={selected}
            onClose={() => setSelected(null)}
            onReported={applyReport}
          />
        )}
      </main>
    </div>
  )
}
