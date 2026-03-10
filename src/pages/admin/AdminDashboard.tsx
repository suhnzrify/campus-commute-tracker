import { motion } from 'framer-motion';
import { Bus, Users, Truck, AlertTriangle, Activity, Clock, MapPin } from 'lucide-react';
import { mockBuses, mockDrivers, mockStudents, mockNotifications } from '@/lib/mockData';
import MapView from '@/components/MapView';
import { mockRoutes } from '@/lib/mockData';

const stats = [
  {
    label: 'Total Buses',
    value: mockBuses.length,
    icon: Bus,
    gradient: 'stat-gradient',
  },
  {
    label: 'Active Buses',
    value: mockBuses.filter(b => b.status === 'active').length,
    icon: Activity,
    gradient: 'success-gradient',
  },
  {
    label: 'Total Drivers',
    value: mockDrivers.length,
    icon: Truck,
    gradient: 'stat-gradient',
  },
  {
    label: 'Total Students',
    value: mockStudents.length,
    icon: Users,
    gradient: 'warning-gradient',
  },
];

export default function AdminDashboard() {
  const activeDriver = mockDrivers.find(d => d.isOnTrip);
  const route = mockRoutes[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your bus tracking system</p>
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
            <MapView
              busLocation={activeDriver?.location}
              stops={route.stops}
              height="350px"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <Bus className="w-4 h-4 text-primary" />
              Bus Status
            </h3>
            <div className="space-y-2">
              {mockBuses.map(bus => (
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
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Recent Alerts
            </h3>
            <div className="space-y-2">
              {mockNotifications.slice(0, 3).map(n => (
                <div key={n.id} className="p-2 rounded-lg bg-muted text-sm">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
