import { mockDrivers, mockRoutes } from '@/lib/mockData';
import MapView from '@/components/MapView';

export default function AdminMap() {
  const activeDriver = mockDrivers.find(d => d.isOnTrip);
  const allStops = mockRoutes.flatMap(r => r.stops);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold">Live Map</h1>
      <MapView
        busLocation={activeDriver?.location}
        stops={allStops}
        height="calc(100vh - 200px)"
      />
    </div>
  );
}
