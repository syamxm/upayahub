import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"
import { db } from "./firebase"

const kualaLumpur = { lat: 3.1450, lng: 101.6958 }

export default function AccessibilityMap({ onSelect }) {
  const [locations, setLocations] = useState([])

  useEffect(() => {
    getDocs(collection(db, "locations")).then((snapshot) =>
      setLocations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    )
  }, [])

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <Map
        defaultCenter={kualaLumpur}
        defaultZoom={13}
        gestureHandling="greedy"
        disableDefaultUI
        className="w-full h-full"
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={{ lat: location.lat, lng: location.lng }}
            title={location.name}
            onClick={() => onSelect(location)}
          />
        ))}
      </Map>
    </APIProvider>
  )
}
