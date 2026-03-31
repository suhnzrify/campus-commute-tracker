import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, MapPin, Clock, Gauge, Navigation, ShieldAlert, Bell, Users, Bus as BusIcon, Route as RouteIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapView from '@/components/MapView';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useRoutes } from '@/hooks/useRoutes';
import { useBuses, useUpdateBusLocation, useBusStudents } from '@/hooks/useBuses';
import { useDrivers } from '@/hooks/useDrivers';
import { useNotifications, useSendNotification } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/authContext';
import { API_URL } from '@/lib/api';
import { Geolocation } from '@capacitor/geolocation';

export default function DriverTrip() {
  const { user } = useAuth();
  
  const { data: routes = [], isLoading: loadingRoutes } = useRoutes();
  const { data: buses = [], isLoading: loadingBuses } = useBuses();
  const { data: drivers = [], refetch: refetchDrivers, isLoading: loadingDrivers } = useDrivers();
  const updateLocation = useUpdateBusLocation();
  const sendNotification = useSendNotification();

  const driver = drivers.find(d => d.id === user?.entityId);
  const bus = buses.find(b => b.id === driver?.assignedBusId);
  const route = bus ? routes.find(r => r.id === bus.routeId) || routes[0] : routes[0];

  const { data: students = [] } = useBusStudents(bus?.id || '');

  const loadingData = loadingRoutes || loadingBuses || loadingDrivers;

  const [selectedBusId, setSelectedBusId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [isOnTrip, setIsOnTrip] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const watchIdRef = useRef<string | null>(null);

  useEffect(() => {
    const checkPerms = async () => {
      try {
        const perms = await Geolocation.checkPermissions();
        setLocationPermission(perms.location === 'granted' ? 'granted' : 'unknown');
      } catch (e) {
        setLocationPermission('unknown');
      }
    };
    checkPerms();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current != null) {
        Geolocation.clearWatch({ id: watchIdRef.current }).catch(() => {});
      }
    };
  }, []);

  const handleAssignBus = async () => {
    if (!selectedBusId || !driver) return;
    setIsAssigning(true);
    try {
      await fetch(`${API_URL}/drivers/${driver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedBusId: selectedBusId })
      });
      await refetchDrivers();
    } catch (e) {
      alert('Failed to assign bus');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClearBus = async () => {
    if (!driver) return;
    setIsAssigning(true);
    try {
      await fetch(`${API_URL}/drivers/${driver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedBusId: '' })
      });
      await refetchDrivers();
    } catch (e) {
      alert('Failed to unassign bus');
    } finally {
      setIsAssigning(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const status = await Geolocation.requestPermissions();
      if (status.location === 'granted') {
        setLocationPermission('granted');
        return true;
      }
      setLocationPermission('denied');
      return false;
    } catch (e) {
      return new Promise((resolve) => {
        if (!('geolocation' in navigator)) return resolve(false);
        navigator.geolocation.getCurrentPosition(
          () => { setLocationPermission('granted'); resolve(true); },
          () => { setLocationPermission('denied'); resolve(false); },
        );
      });
    }
  };

  const startTrip = () => {
    setShowLocationDialog(true);
  };

  const confirmStartTrip = async () => {
    setShowLocationDialog(false);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      alert('Location permission is required to start the trip. Please enable location access.');
      return;
    }

    setElapsed(0);
    setIsOnTrip(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    const updatePosition = (lat: number, lng: number, speedVal: number) => {
      setBusLocation({ lat, lng });
      setSpeed(speedVal);
      if (bus) updateLocation.mutate({ busId: bus.id, lat, lng, speed: speedVal });
    }

    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const calcSpeed = pos.coords.speed !== null ? Math.round(pos.coords.speed * 3.6) : 0;
      updatePosition(lat, lng, calcSpeed);
    } catch (error) {
      console.warn('Geolocation error:', error);
      if (route?.stops?.[0]) {
         updatePosition(route.stops[0].lat, route.stops[0].lng, 0);
      }
    }

    if (watchIdRef.current != null) {
      await Geolocation.clearWatch({ id: watchIdRef.current }).catch(() => {});
    }
    
    try {
      watchIdRef.current = await Geolocation.watchPosition({ enableHighAccuracy: true, maximumAge: 2000 }, (pos, err) => {
        if (err || !pos) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const calcSpeed = pos.coords.speed !== null ? Math.round(pos.coords.speed * 3.6) : 0;
        updatePosition(lat, lng, calcSpeed);
      });
    } catch (e) {
      console.error('Watch Location failed natively:', e);
    }
  };

  const endTrip = async () => {
    setIsOnTrip(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current != null) {
      await Geolocation.clearWatch({ id: watchIdRef.current }).catch(() => {});
      watchIdRef.current = null;
    }
    setBusLocation(null);
    setSpeed(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSendAlert = async () => {
    if (!alertMessage.trim() || !bus) return;
    try {
      await sendNotification.mutateAsync({
        title: 'Driver Alert',
        message: alertMessage,
        type: 'warning',
        from_user: driver?.name || 'Driver',
        targetBusId: bus.id
      });
      alert('Alert seamlessly dispatched to all onboard students.');
      setShowAlertDialog(false);
      setAlertMessage('');
    } catch (err) {
      alert('Failed to dispatch alert to server.');
    }
  };

  if (loadingData) {
    return <p className="text-sm text-muted-foreground p-4">Loading driver workspace...</p>;
  }

  if (!driver) {
    return <p className="text-sm text-destructive p-4">Driver record not securely linked to your profile segment.</p>;
  }

  if (!driver.assignedBusId || !bus) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg mx-auto p-4 pt-10 text-center">
        <BusIcon className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
        <h1 className="text-2xl font-display font-bold">Select Your Bus</h1>
        <p className="text-sm text-muted-foreground">You represent you are off-duty. Please allocate a bus to commence tracking mapping.</p>
        
        <div className="glass-card p-6 rounded-2xl text-left space-y-4">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-widest pl-1">Available Fleet</label>
          <select 
            value={selectedBusId} 
            onChange={(e) => setSelectedBusId(e.target.value)}
            className="w-full bg-background rounded-xl p-3 border border-border outline-none text-foreground"
          >
            <option value="">-- Choose a Bus --</option>
            {buses.map(b => (
              <option key={b.id} value={b.id}>{b.number} - {b.model}</option>
            ))}
          </select>
          <Button disabled={!selectedBusId || isAssigning} onClick={handleAssignBus} className="w-full h-12 rounded-xl text-lg font-bold">
            {isAssigning ? 'Linking...' : 'Confirm Assignment'}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold">Trip Control</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span className="font-semibold text-foreground">{bus.number}</span> · {route?.name}
          </p>
        </div>
        {!isOnTrip && (
          <Button variant="outline" size="sm" onClick={handleClearBus} className="text-xs h-8 rounded-lg">
            Change Bus
          </Button>
        )}
      </div>

      {/* Tools Row */}
      <div className="flex gap-2">
         <Button variant="secondary" onClick={() => setShowStudentsDialog(true)} className="flex-1 rounded-xl glass-card border flex items-center justify-center gap-2 h-12">
           <Users className="w-5 h-5 text-primary" />
           <span className="font-semibold">Manifest ({students.length})</span>
         </Button>
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
              <p className="text-sm opacity-80">Transmitting geolocation bridge</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <Navigation className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="font-display font-semibold text-lg">Ready to Start</p>
              <p className="text-sm text-muted-foreground">Ensure passenger count matches roster before initiating movement</p>
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
        <div className="space-y-3">
          <Button onClick={endTrip} variant="destructive" className="w-full h-14 rounded-xl text-lg font-bold gap-2" size="lg">
            <Square className="w-5 h-5" /> End Trip
          </Button>
          <Button onClick={() => setShowAlertDialog(true)} variant="outline" className="w-full h-12 rounded-xl gap-2">
            <Bell className="w-4 h-4" /> Broadcast Announcement
          </Button>
        </div>
      )}

      {/* Stats */}
      {isOnTrip && route && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-3 text-center">
            <Gauge className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-display font-bold">{speed}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">km/h</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-warning" />
            <p className="text-xl font-display font-bold">{formatTime(elapsed)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Elapsed</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-success" />
            <p className="text-xl font-display font-bold">{route.stops?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Stops</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display font-semibold mb-3">Live Map</h3>
        <MapView busLocation={busLocation} stops={route?.stops || []} height="300px" />
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
                <p className="text-muted-foreground">Students rely on pinpoint spatial updates mapped onto their clients.</p>
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

      {/* Quick Alert Dialog */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="sm:max-w-md glass-card rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning" />
              Send Alert to Students
            </DialogTitle>
            <DialogDescription>
              Dispatch an emergency or informative broadcast to your manifest.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Type your message..."
            value={alertMessage}
            onChange={e => setAlertMessage(e.target.value)}
            className="mt-4 rounded-xl"
          />
          <DialogFooter className="mt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowAlertDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendAlert} className="rounded-xl" disabled={!alertMessage.trim()}>
              Send Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Students Dialog */}
      <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
        <DialogContent className="sm:max-w-md glass-card rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b border-border/50">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6 text-primary" />
              Current Manifest
            </DialogTitle>
            <DialogDescription>
              {students.length} students allocated to this bus today.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 py-4">
             {students.length === 0 ? (
               <p className="text-center text-muted-foreground text-sm italic py-6">No students assigned up for this segment.</p>
             ) : (
                students.map((st: any) => (
                  <div key={st.id} className="flex justify-between items-center group p-3 bg-background/50 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {st.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{st.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{st.registerNumber}</p>
                      </div>
                    </div>
                  </div>
                ))
             )}
          </div>
          
          <DialogFooter className="pt-2 border-t border-border/50">
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowStudentsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
