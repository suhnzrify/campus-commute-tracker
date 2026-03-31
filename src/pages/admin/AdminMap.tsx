import MapView from '@/components/MapView';
import { useDrivers } from '@/hooks/useDrivers';
import { useRoutes } from '@/hooks/useRoutes';

export default function AdminMap() {
  const { data: drivers = [], isLoading: loadingDrivers } = useDrivers();
  const { data: routes = [], isLoading: loadingRoutes } = useRoutes();

  const loading = loadingDrivers || loadingRoutes;

  const activeDriver = drivers.find(d => d.isOnTrip);
  const allStops = routes.flatMap(r => r.stops);

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading map data...</div>;
  }

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
