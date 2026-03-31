import { Clock, MapPin } from 'lucide-react';
import MapView from '@/components/MapView';

import { useBuses } from '@/hooks/useBuses';
import { useRoutes } from '@/hooks/useRoutes';

export default function StudentRoute() {
  const { data: routes = [], isLoading: loadingRoutes, error: routesError } = useRoutes();
  const { data: buses = [], isLoading: loadingBuses, error: busesError } = useBuses();

  const loading = loadingRoutes || loadingBuses;
  const error = routesError ? 'Failed to load route from server.' : (busesError ? 'Failed to load buses.' : null);

  const route = routes[0];
  const bus = buses[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">My Route</h1>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {loading && <p className="text-xs text-muted-foreground">Loading route...</p>}
        {route && bus && (
          <p className="text-sm text-muted-foreground">
            {bus.number} · {route.name}
          </p>
        )}
      </div>

      {route ? (
        <div className="glass-card rounded-xl p-4">
          <MapView stops={route.stops} height="250px" />
        </div>
      ) : null}

      {route ? (
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-display font-semibold mb-3">All Stops</h3>
          <div className="space-y-1">
            {route.stops.map((stop, i) => (
              <div key={stop.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    i === 0 ? 'bg-success border-success' :
                    i === route.stops.length - 1 ? 'bg-destructive border-destructive' :
                    'bg-primary border-primary'
                  }`} />
                  {i < route.stops.length - 1 && <div className="w-0.5 h-8 bg-border" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{stop.name}</p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />{stop.waitTime} min wait
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
