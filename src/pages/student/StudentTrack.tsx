import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Gauge, Bus, Navigation, ArrowRight } from 'lucide-react';
import MapView from '@/components/MapView';
import { mockRoutes, mockBuses, mockDrivers } from '@/lib/mockData';

export default function StudentTrack() {
  const route = mockRoutes[0];
  const bus = mockBuses[0];
  const driver = mockDrivers[0];

  const [busLocation, setBusLocation] = useState(driver.location || { lat: route.stops[0].lat, lng: route.stops[0].lng });
  const [speed, setSpeed] = useState(32);
  const [nextStopIndex, setNextStopIndex] = useState(2);
  const [eta, setEta] = useState(8);

  // Simulate bus movement
  useEffect(() => {
    const interval = setInterval(() => {
      setBusLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.4) * 0.0005,
        lng: prev.lng + (Math.random() - 0.3) * 0.0005,
      }));
      setSpeed(Math.floor(25 + Math.random() * 20));
      setEta(prev => Math.max(1, prev - (Math.random() > 0.7 ? 1 : 0)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const nextStop = route.stops[nextStopIndex];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Track My Bus</h1>
        <p className="text-sm text-muted-foreground">{bus.number} · {route.name}</p>
      </div>

      {/* ETA Card */}
      <motion.div
        className="stat-gradient rounded-xl p-5 text-primary-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80 mb-1">Estimated Arrival</p>
            <p className="text-4xl font-display font-bold">{eta} min</p>
            <p className="text-sm opacity-80 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Next: {nextStop.name}
            </p>
          </div>
          <div className="text-right">
            <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-2">
              <Bus className="w-7 h-7" />
            </div>
            <p className="text-xs opacity-80">{speed} km/h</p>
          </div>
        </div>
      </motion.div>

      {/* Live Map */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            Live Location
          </h3>
          <span className="flex items-center gap-1 text-xs text-success font-medium">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live
          </span>
        </div>
        <MapView busLocation={busLocation} stops={route.stops} height="300px" />
      </div>

      {/* Route Progress */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display font-semibold mb-3">Route Progress</h3>
        <div className="space-y-0">
          {route.stops.map((stop, i) => {
            const isPassed = i < nextStopIndex;
            const isNext = i === nextStopIndex;
            const isFuture = i > nextStopIndex;

            return (
              <div key={stop.id} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    isPassed ? 'bg-success border-success' :
                    isNext ? 'bg-primary border-primary ring-4 ring-primary/20' :
                    'bg-muted border-border'
                  }`} />
                  {i < route.stops.length - 1 && (
                    <div className={`w-0.5 h-8 ${isPassed ? 'bg-success' : 'bg-border'}`} />
                  )}
                </div>
                <div className={`flex-1 py-1 ${isNext ? 'font-semibold' : ''}`}>
                  <p className={`text-sm ${isFuture ? 'text-muted-foreground' : ''}`}>
                    {stop.name}
                    {isNext && <span className="ml-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">Next Stop</span>}
                    {isPassed && <span className="ml-2 text-xs text-success">✓</span>}
                  </p>
                </div>
                {isNext && <span className="text-xs text-primary font-medium">{eta} min</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver Info */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display font-semibold mb-2">Driver</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-display font-bold text-primary">{driver.name.charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{driver.name}</p>
            <p className="text-xs text-muted-foreground">{driver.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
