import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bus, LogOut, Bell, Menu, X, LayoutDashboard, Users, Truck, MapPin, Route, Play, Map, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { useStudents } from '@/hooks/useStudents';
import { useDrivers } from '@/hooks/useDrivers';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Buses', path: '/admin/buses', icon: Bus },
    { label: 'Drivers', path: '/admin/drivers', icon: Truck },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Routes', path: '/admin/routes', icon: Route },
    { label: 'Broadcasts', path: '/admin/alerts', icon: Bell },
    { label: 'Live Map', path: '/admin/map', icon: MapPin },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  driver: [
    { label: 'Trip', path: '/driver', icon: Play },
    { label: 'Route', path: '/driver/route', icon: Route },
    { label: 'Alerts', path: '/driver/alerts', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  student: [
    { label: 'Track', path: '/student', icon: Map },
    { label: 'Route', path: '/student/route', icon: Route },
    { label: 'Alerts', path: '/student/alerts', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ],
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: students = [] } = useStudents();
  const { data: drivers = [] } = useDrivers();

  let targetBusId = 'ALL';
  if (user?.role === 'student') {
    const s = students.find(x => x.id === user.entityId);
    if (s?.assignedBusId) targetBusId = s.assignedBusId;
  } else if (user?.role === 'driver') {
    const d = drivers.find(x => x.id === user.entityId);
    if (d?.assignedBusId) targetBusId = d.assignedBusId;
  }

  const { data: notifications = [] } = useNotifications(targetBusId);
  const unreadCount = notifications.length;

  if (!user) return null;
  const items = navItems[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-nav text-nav-foreground">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Bus className="w-6 h-6 text-nav-accent" />
            <span className="font-display font-bold text-lg">BusTrack</span>
            <span className="hidden sm:inline text-xs bg-nav-accent/20 text-nav-accent px-2 py-0.5 rounded-full capitalize">{user.role}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-nav-accent/10 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-nav-accent/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-1 px-4 pb-2">
          {items.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-nav-accent text-primary-foreground' : 'text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-accent/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-nav border-b border-nav-accent/20 overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {items.map(item => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-nav-accent text-primary-foreground' : 'text-nav-foreground/70 hover:bg-nav-accent/10'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Notifications panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 right-2 z-50 w-80 max-h-96 overflow-auto glass-card rounded-xl p-3 space-y-2"
          >
            <h3 className="font-display font-semibold text-sm mb-2">Notifications</h3>
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map(n => (
                <div key={n.id} className="p-2 rounded-lg bg-muted text-xs border border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      n.type === 'emergency' ? 'bg-destructive' : n.type === 'warning' ? 'bg-warning' : 'bg-info'
                    }`} />
                    <span className="font-semibold">{n.title}</span>
                  </div>
                  <p className="text-muted-foreground">{n.message}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1">{formatTime(new Date(n.timestamp))}</p>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg text-sm text-muted-foreground text-center">
                No notifications
              </div>
            )}
            {notifications.length > 5 && (
              <div className="text-center text-xs text-primary pt-2 font-medium cursor-pointer" onClick={() => navigate(`/${user.role}/alerts`)}>
                View all
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

function formatTime(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

