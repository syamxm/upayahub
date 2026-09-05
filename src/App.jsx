import AccessibilityMap from "./AccessibilityMap"

export default function App() {
  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 bg-emerald-600 text-white">
        <h1 className="text-xl font-bold">UpayaHub</h1>
        <p className="text-sm text-emerald-50">Know Before You Go.</p>
      </header>
      <main className="flex-1">
        <AccessibilityMap />
      </main>
    </div>
  )
}
