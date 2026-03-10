import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BusStop } from '@/lib/mockData';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const busIcon = new L.DivIcon({
  html: `<div style="background: hsl(217 91% 50%); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 10h18M7 17v2M17 17v2"/></svg>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const stopIcon = new L.DivIcon({
  html: `<div style="background: hsl(160 70% 42%); width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface MapViewProps {
  busLocation?: { lat: number; lng: number } | null;
  stops?: BusStop[];
  height?: string;
  showRoute?: boolean;
}

function FitBounds({ stops, busLocation }: { stops?: BusStop[]; busLocation?: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [];
    stops?.forEach(s => points.push([s.lat, s.lng]));
    if (busLocation) points.push([busLocation.lat, busLocation.lng]);
    if (points.length > 0) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, []);
  return null;
}

export default function MapView({ busLocation, stops = [], height = '400px', showRoute = true }: MapViewProps) {
  const center: [number, number] = busLocation
    ? [busLocation.lat, busLocation.lng]
    : stops.length > 0
    ? [stops[0].lat, stops[0].lng]
    : [13.0827, 80.2707];

  const routePoints: [number, number][] = stops.map(s => [s.lat, s.lng]);

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-border">
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds stops={stops} busLocation={busLocation} />

        {showRoute && routePoints.length > 1 && (
          <Polyline positions={routePoints} pathOptions={{ color: 'hsl(217 91% 50%)', weight: 4, opacity: 0.7 }} />
        )}

        {stops.map(stop => (
          <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={stopIcon}>
            <Popup>
              <strong>{stop.name}</strong>
              <br />Wait: {stop.waitTime} min
            </Popup>
          </Marker>
        ))}

        {busLocation && (
          <Marker position={[busLocation.lat, busLocation.lng]} icon={busIcon}>
            <Popup>
              <strong>Bus Live Location</strong>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
