import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"
import { worstCondition, pinIcon } from "./conditions"

const kualaLumpur = { lat: 3.145, lng: 101.6958 }

export default function AccessibilityMap({ locations, onSelect }) {
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
            icon={pinIcon(worstCondition(location))}
            onClick={() => onSelect(location)}
          />
        ))}
      </Map>
    </APIProvider>
  )
}
