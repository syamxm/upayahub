import { useState } from "react"
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

export default function App() {
  const [locations, setLocations] = useState([])
  const [status, setStatus] = useState("")

  async function addLocation() {
    setStatus("Writing...")
    await addDoc(collection(db, "locations"), {
      name: "KL Sentral",
      hasRamp: true,
      createdAt: serverTimestamp(),
    })
    setStatus("Write OK")
  }

  async function loadLocations() {
    setStatus("Reading...")
    const snapshot = await getDocs(collection(db, "locations"))
    setLocations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    setStatus("Read OK")
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold text-emerald-600">UpayaHub</h1>
      <p className="text-slate-600">Know Before You Go.</p>
      <div className="flex gap-2">
        <button onClick={addLocation} className="px-4 py-2 rounded bg-emerald-600 text-white">
          Add test location
        </button>
        <button onClick={loadLocations} className="px-4 py-2 rounded bg-slate-700 text-white">
          Load locations
        </button>
      </div>
      <p className="text-sm text-slate-500">{status}</p>
      <ul className="text-sm text-slate-700">
        {locations.map((location) => (
          <li key={location.id}>
            {location.name} — ramp: {String(location.hasRamp)}
          </li>
        ))}
      </ul>
    </div>
  )
}
