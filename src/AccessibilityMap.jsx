import { useEffect } from "react"
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps"
import { worstCondition, pinIcon } from "./conditions"

const kualaLumpur = { lat: 3.145, lng: 101.6958 }
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function FollowOrigin({ origin }) {
  const map = useMap()
  useEffect(() => {
    if (map && origin) {
      map.panTo(origin)
      if (map.getZoom() < 15) map.setZoom(15)
    }
  }, [map, origin])
  return null
}

const youAreHere = {
  path: 0, // google.maps.SymbolPath.CIRCLE
  scale: 8,
  fillColor: "#2563eb",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 3,
}

export default function AccessibilityMap({ locations, onSelect, origin }) {
  if (!apiKey) {
    return (
      <div className="grid h-full place-items-center bg-muted p-6 text-center">
        <p className="max-w-xs text-sm text-muted-foreground">
          The map cannot load because no Google Maps key is configured. The place list still works.
        </p>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
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
        {origin && <Marker position={origin} title="You are here" icon={youAreHere} zIndex={1000} />}
        <FollowOrigin origin={origin} />
      </Map>
    </APIProvider>
  )
}
