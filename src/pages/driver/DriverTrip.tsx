import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, MapPin, Clock, Gauge, Navigation, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MapView from '@/components/MapView';
import { mockRoutes, mockBuses } from '@/lib/mockData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function DriverTrip() {
  const [isOnTrip, setIsOnTrip] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const watchIdRef = useRef<number | null>(null);
  const route = mockRoutes[0];
  const bus = mockBuses[0];

  useEffect(() => {
    // Check initial location permission status
    if ('geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(result => {
        setLocationPermission(result.state as 'granted' | 'denied');
        result.onchange = () => {
          setLocationPermission(result.state as 'granted' | 'denied');
        };
      }).catch(() => {
        // Permission API not supported, will check on action
        setLocationPermission('unknown');
      });
    }

    // cleanup on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current != null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const requestLocationPermission = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission('granted');
          resolve(true);
        },
        () => {
          setLocationPermission('denied');
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const startTrip = () => {
    // Show location permission dialog first
    setShowLocationDialog(true);
  };

  const confirmStartTrip = async () => {
    setShowLocationDialog(false);
    
    // Request location permission
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      // Show message that location is needed
      alert('Location permission is required to start the trip. Please enable location access in your browser settings.');
      return;
    }

    setElapsed(0);
    setIsOnTrip(true);

    // Start timer / speed simulation (speed is still simulated)
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
      setSpeed(Math.floor(25 + Math.random() * 20));
    }, 1000);

    // One-time current position
    navigator.geolocation.getCurrentPosition(
      pos => {
        setBusLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // On error (denied, timeout, etc.), fall back to first stop
        setBusLocation({ lat: route.stops[0].lat, lng: route.stops[0].lng });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Continuous updates while trip is active
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        setBusLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // keep previous busLocation if watch errors; no-op
      },
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
  };

  const endTrip = () => {
    setIsOnTrip(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current != null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsOnTrip(true);
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

      {/* Location Permission Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-warning" />
              Location Permission Required
            </DialogTitle>
            <DialogDescription>
              To start the trip and share your live location with students, we need access to your device's location.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Why do we need this?</p>
                <p className="text-muted-foreground">Students need to see your real-time location on the map to track the bus.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStartTrip}>
              Allow Location & Start Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
