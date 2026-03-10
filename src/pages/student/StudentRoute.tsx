import { Clock, MapPin } from 'lucide-react';
import { mockRoutes, mockBuses } from '@/lib/mockData';
import MapView from '@/components/MapView';

export default function StudentRoute() {
  const route = mockRoutes[0];
  const bus = mockBuses[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">My Route</h1>
        <p className="text-sm text-muted-foreground">{bus.number} · {route.name}</p>
      </div>

      <div className="glass-card rounded-xl p-4">
        <MapView stops={route.stops} height="250px" />
      </div>

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
    </div>
  );
}
