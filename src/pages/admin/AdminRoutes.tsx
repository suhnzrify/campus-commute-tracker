import { useState } from 'react';
import { motion } from 'framer-motion';
import { Route, MapPin, Clock } from 'lucide-react';
import { mockRoutes } from '@/lib/mockData';
import MapView from '@/components/MapView';

export default function AdminRoutes() {
  const [selectedRoute, setSelectedRoute] = useState(mockRoutes[0].id);
  const route = mockRoutes.find(r => r.id === selectedRoute)!;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold">Routes</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {mockRoutes.map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedRoute(r.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedRoute === r.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-display font-semibold mb-3">Bus Stops</h3>
          <div className="space-y-1">
            {route.stops.map((stop, i) => (
              <div key={stop.id} className="flex items-center gap-3 p-2">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-success' : i === route.stops.length - 1 ? 'bg-destructive' : 'bg-primary'}`} />
                  {i < route.stops.length - 1 && <div className="w-0.5 h-6 bg-border" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{stop.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Wait: {stop.waitTime} min
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Stop {stop.order}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h3 className="font-display font-semibold mb-3">Route Map</h3>
          <MapView stops={route.stops} height="350px" />
        </div>
      </div>
    </div>
  );
}
