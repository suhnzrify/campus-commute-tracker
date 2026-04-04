import { motion } from 'framer-motion';
import { Bus, Users, Truck, AlertTriangle, Activity, Clock, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MapView from '@/components/MapView';

import { useBuses, useBusLocation } from '@/hooks/useBuses';
import { useDrivers } from '@/hooks/useDrivers';
import { useStudents } from '@/hooks/useStudents';
import { useRoutes } from '@/hooks/useRoutes';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { API_URL } from '@/lib/api';

export default function AdminDashboard() {
  const [alertMsg, setAlertMsg] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);
  const { data: buses = [], isLoading: loadingBuses, refetch: refetchBuses } = useBuses();
  const { data: drivers = [], isLoading: loadingDrivers, refetch: refetchDrivers } = useDrivers();
  const { data: students = [], isLoading: loadingStudents, refetch: refetchStudents } = useStudents();
  const { data: routes = [], isLoading: loadingRoutes, refetch: refetchRoutes } = useRoutes();
  const { data: notifications = [], refetch: refetchNotifications } = useNotifications('ALL');
  
  // Find which bus is actually active to show on map
  const activeBus = buses.find(b => b.status === 'active') || buses[0];
  const { data: busLocation } = useBusLocation(activeBus?.id);

  const handleRefresh = () => {
    refetchBuses();
    refetchDrivers();
    refetchStudents();
    refetchRoutes();
    refetchNotifications();
  };

  const handleBroadcast = async () => {
    if (!alertMsg.trim()) return;
    setSendingAlert(true);
    try {
      await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Admin Broadcast',
          message: alertMsg,
          type: 'warning',
          from: 'Admin',
          targetBusId: 'ALL'
        })
      });
      setAlertMsg('');
      refetchNotifications();
    } catch (e) {
      console.error(e);
    }
    setSendingAlert(false);
  };

  const activeDriver = drivers.find(d => d.isOnTrip);
  const route = routes[0];

  const isLoading = loadingBuses || loadingDrivers || loadingStudents || loadingRoutes;

  const stats = [
    {
      label: 'Total Buses',
      value: buses.length,
      icon: Bus,
      gradient: 'stat-gradient',
    },
    {
      label: 'Active Buses',
      value: buses.filter(b => b.status === 'active').length,
      icon: Activity,
      gradient: 'success-gradient',
    },
    {
      label: 'On Trip Drivers',
      value: drivers.filter(d => d.isOnTrip).length,
      icon: Truck,
      gradient: 'warning-gradient',
    },
    {
      label: 'Total Students',
      value: students.length,
      icon: Users,
      gradient: 'stat-gradient',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of your bus tracking system</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.gradient} rounded-xl p-4 text-primary-foreground`}
          >
            <stat.icon className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-xs opacity-80">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl p-4">
            <h2 className="font-display font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Live Bus Tracking
            </h2>
            {route ? (
              <MapView
                busLocation={busLocation}
                stops={route.stops}
                height="350px"
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground border rounded-lg bg-muted/50">
                No routes configured yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <Bus className="w-4 h-4 text-primary" />
              Bus Status
            </h3>
            <div className="space-y-2">
              {buses.length > 0 ? buses.map(bus => (
                <div key={bus.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <span className="text-sm font-medium">{bus.number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    bus.status === 'active' ? 'bg-success/15 text-success' :
                    bus.status === 'maintenance' ? 'bg-warning/15 text-warning' :
                    'bg-muted-foreground/15 text-muted-foreground'
                  }`}>
                    {bus.status}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground py-2 text-center">No buses available.</p>
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Broadcast Alert
            </h3>
            <div className="flex flex-col gap-2">
              <textarea 
                value={alertMsg}
                onChange={e => setAlertMsg(e.target.value)}
                placeholder="Type global alert message..."
                className="w-full h-20 text-sm rounded-xl border border-input bg-background px-3 py-2 resize-none"
              />
              <Button onClick={handleBroadcast} size="sm" className="w-full rounded-xl" disabled={sendingAlert || !alertMsg.trim()}>
                {sendingAlert ? 'Sending...' : 'Send to Everyone'}
              </Button>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              Recent Alerts
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n.id} className="p-3 rounded-lg bg-muted text-sm border border-border/50">
                  <p className="font-medium text-xs text-primary mb-1">{n.title} • <span className="text-muted-foreground font-normal">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-2">No active notifications</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
