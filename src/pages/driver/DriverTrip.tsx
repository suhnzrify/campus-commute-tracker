import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, MapPin, Clock, Gauge, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MapView from '@/components/MapView';
import { mockRoutes, mockBuses } from '@/lib/mockData';

export default function DriverTrip() {
  const [isOnTrip, setIsOnTrip] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const route = mockRoutes[0];
  const bus = mockBuses[0];

  // Simulate bus movement along route
  useEffect(() => {
    if (!isOnTrip) return;

    let progress = 0;
    const stops = route.stops;

    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
      setSpeed(Math.floor(25 + Math.random() * 20));

      progress += 0.008;
      if (progress >= stops.length - 1) progress = 0;

      const idx = Math.floor(progress);
      const frac = progress - idx;
      const from = stops[idx];
      const to = stops[Math.min(idx + 1, stops.length - 1)];

      setBusLocation({
        lat: from.lat + (to.lat - from.lat) * frac,
        lng: from.lng + (to.lng - from.lng) * frac,
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isOnTrip]);

  const startTrip = () => {
    setIsOnTrip(true);
    setElapsed(0);
    setBusLocation({ lat: route.stops[0].lat, lng: route.stops[0].lng });
  };

  const endTrip = () => {
    setIsOnTrip(false);
    clearInterval(intervalRef.current);
    setBusLocation(null);
    setSpeed(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Trip Control</h1>
        <p className="text-sm text-muted-foreground">{bus.number} · {route.name}</p>
      </div>

      {/* Status Card */}
      <motion.div
        className={`rounded-xl p-6 text-center ${isOnTrip ? 'success-gradient text-success-foreground' : 'glass-card'}`}
        layout
      >
        <AnimatePresence mode="wait">
          {isOnTrip ? (
            <motion.div key="active" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-primary-foreground animate-pulse" />
                <span className="font-display font-bold text-lg">TRIP ACTIVE</span>
              </div>
              <p className="text-4xl font-display font-bold mb-1">{formatTime(elapsed)}</p>
              <p className="text-sm opacity-80">Sharing live location</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <Navigation className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="font-display font-semibold text-lg">Ready to Start</p>
              <p className="text-sm text-muted-foreground">Tap below to begin sharing location</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Button */}
      {!isOnTrip ? (
        <Button onClick={startTrip} className="w-full h-14 rounded-xl text-lg font-bold gap-2" size="lg">
          <Play className="w-5 h-5" /> Start Trip
        </Button>
      ) : (
        <Button onClick={endTrip} variant="destructive" className="w-full h-14 rounded-xl text-lg font-bold gap-2" size="lg">
          <Square className="w-5 h-5" /> End Trip
        </Button>
      )}

      {/* Stats */}
      {isOnTrip && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-3 text-center">
            <Gauge className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-display font-bold">{speed}</p>
            <p className="text-[10px] text-muted-foreground">km/h</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-warning" />
            <p className="text-xl font-display font-bold">{formatTime(elapsed)}</p>
            <p className="text-[10px] text-muted-foreground">Elapsed</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-success" />
            <p className="text-xl font-display font-bold">{route.stops.length}</p>
            <p className="text-[10px] text-muted-foreground">Stops</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display font-semibold mb-3">Live Map</h3>
        <MapView busLocation={busLocation} stops={route.stops} height="300px" />
      </div>
    </div>
  );
}
