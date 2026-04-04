import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Bus, Navigation, AlertTriangle, Phone } from 'lucide-react';
import MapView from '@/components/MapView';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useBuses, useBusLocation } from '@/hooks/useBuses';
import { useRoutes } from '@/hooks/useRoutes';
import { useDrivers } from '@/hooks/useDrivers';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/lib/authContext';

export default function StudentTrack() {
  const { user } = useAuth();

  const { data: routes = [], isLoading: loadingRoutes } = useRoutes();
  const { data: buses = [], isLoading: loadingBuses } = useBuses();
  const { data: drivers = [], isLoading: loadingDrivers } = useDrivers();
  const { data: students = [], isLoading: loadingStudents } = useStudents();

  const loading = loadingRoutes || loadingBuses || loadingDrivers || loadingStudents;

  // Find the logged-in student's profile and their assigned bus
  const currentStudent = students.find(s => s.id === user?.entityId);
  const assignedBusId = currentStudent?.assignedBusId || '';

  // Use assigned bus if available, else fallback to first active bus
  const bus = assignedBusId
    ? buses.find(b => b.id === assignedBusId)
    : buses.find(b => b.status === 'active') || buses[0];

  // Find the route for this bus
  const route = bus?.routeId ? routes.find(r => r.id === bus.routeId) : routes[0];

  // Find driver assigned to this bus
  const driver = bus ? drivers.find(d => d.assignedBusId === bus.id) : drivers[0];

  const { data: liveData } = useBusLocation(bus?.id);

  const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [speed, setSpeed] = useState(0);
  const [nextStopIndex, setNextStopIndex] = useState(0);
  const [eta, setEta] = useState(0);
  const [myStopId, setMyStopId] = useState<string>('');
  const [isBoarded, setIsBoarded] = useState(() => localStorage.getItem('isBoarded') === 'true');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('isBoarded', String(isBoarded));
  }, [isBoarded]);

  // Initialise pickup stop from student profile
  useEffect(() => {
    if (currentStudent?.pickupStopId && !myStopId) {
      setMyStopId(currentStudent.pickupStopId);
    }
  }, [currentStudent]);

  // Sync live location
  useEffect(() => {
    if (liveData) {
      setBusLocation({ lat: liveData.lat, lng: liveData.lng });
      setSpeed(liveData.speed > 0 ? liveData.speed : 30);
    } else if (route?.stops?.[0] && !busLocation) {
      setBusLocation({ lat: route.stops[0].lat, lng: route.stops[0].lng });
    }
  }, [liveData, route]);

  // Haversine distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 +
              c(lat1 * p) * c(lat2 * p) *
              (1 - c((lon2 - lon1) * p)) / 2;
    return 12742 * Math.asin(Math.sqrt(a));
  };

  // Update ETA and route progression dynamically
  useEffect(() => {
    if (!route || !route.stops.length || !busLocation || busLocation.lat === 0) return;

    let currentIndex = nextStopIndex;
    if (currentIndex >= route.stops.length) currentIndex = route.stops.length - 1;

    let targetStop = route.stops[currentIndex];
    if (myStopId && !isBoarded) {
      const specificStop = route.stops.find(s => s.id === myStopId);
      if (specificStop) targetStop = specificStop;
    }

    if (targetStop) {
      const dist = calculateDistance(busLocation.lat, busLocation.lng, targetStop.lat, targetStop.lng);

      if (dist < 0.1 && currentIndex < route.stops.length - 1) {
        setNextStopIndex(currentIndex + 1);
      }

      const effectiveSpeed = Math.max(speed, 15);
      const timeHours = dist / effectiveSpeed;
      const timeMins = Math.max(1, Math.round(timeHours * 60));

      setEta(isBoarded ? 0 : timeMins);
    }
  }, [busLocation, route, speed, nextStopIndex, myStopId, isBoarded]);

  const nextStop = route?.stops?.[nextStopIndex];
  const targetStopObj = myStopId && !isBoarded ? route?.stops.find(s => s.id === myStopId) : nextStop;

  const handleReportIssue = async () => {
    if (!reportMessage.trim()) return;
    setReportLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setReportLoading(false);
    setShowReportDialog(false);
    setReportMessage('');
    alert('Issue reported successfully!');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading tracking information...</p>
      </div>
    );
  }

  if (!route || !bus) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Track My Bus</h1>
        <div className="glass-card rounded-xl p-8 text-center">
          <Bus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold mb-1">No Bus Assigned</p>
          <p className="text-sm text-muted-foreground">
            You haven't been assigned to a bus yet. Please contact your admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Track My Bus</h1>
        <p className="text-sm text-muted-foreground">{bus.number} · {route.name}</p>
      </div>

      {/* Action Hub */}
      <div className="glass-card rounded-xl p-4">
        <label className="text-sm font-semibold mb-2 block">Where are you waiting?</label>
        <select
          value={myStopId}
          onChange={e => setMyStopId(e.target.value)}
          className="w-full h-10 rounded-xl border border-input bg-background/50 px-3 text-sm mb-3"
          disabled={isBoarded}
        >
          <option value="">Select your stop...</option>
          {route.stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <div className="flex gap-2">
          <Button
            variant={isBoarded ? 'default' : 'outline'}
            className={`flex-1 rounded-xl shadow-none transition-all ${isBoarded ? 'bg-success text-success-foreground hover:bg-success/90' : ''}`}
            onClick={() => setIsBoarded(!isBoarded)}
          >
            {isBoarded ? '🟢 On Board' : '🚶 Waiting at Stop'}
          </Button>
        </div>
      </div>

      {/* ETA Card */}
      <motion.div
        className={`${isBoarded ? 'success-gradient' : 'stat-gradient'} rounded-xl p-5 text-primary-foreground`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80 mb-1">{isBoarded ? 'Enjoy your trip!' : 'Estimated Arrival'}</p>
            <p className="text-4xl font-display font-bold">{isBoarded ? 'Arrived' : `${eta} min`}</p>
            {targetStopObj && !isBoarded && (
              <p className="text-sm opacity-80 mt-1 flex items-center gap-1 bg-black/10 px-2 py-0.5 rounded-full w-fit">
                <MapPin className="w-3 h-3" /> ETA to {targetStopObj.name}
              </p>
            )}
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
                    {myStopId === stop.id && !isBoarded && <span className="ml-2 text-[10px] uppercase font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">My Stop</span>}
                    {isPassed && <span className="ml-2 text-xs text-success">✓</span>}
                  </p>
                </div>
                {myStopId === stop.id && !isBoarded && <span className="text-xs text-primary font-medium">{eta} min</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver Info */}
      {driver && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-display font-semibold mb-2">Driver</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-display font-bold text-primary">{driver.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{driver.name}</p>
                <p className="text-xs text-muted-foreground">{driver.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => window.open(`tel:${driver.phone}`)}>
                <Phone className="w-3 h-3" /> Call
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => setShowReportDialog(true)}>
                <AlertTriangle className="w-3 h-3" /> Report
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Let us know about any issues with your bus service. We'll address it promptly.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the issue..."
            value={reportMessage}
            onChange={e => setReportMessage(e.target.value)}
            className="min-h-24"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReportIssue} disabled={reportLoading || !reportMessage.trim()}>
              {reportLoading ? 'Reporting...' : 'Report Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
