import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"

const klSentral = { lat: 3.1339, lng: 101.6869 }

export default function AccessibilityMap() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <Map
        defaultCenter={klSentral}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI
        className="w-full h-full"
      >
        <Marker position={klSentral} title="KL Sentral" />
      </Map>
    </APIProvider>
  )
}
