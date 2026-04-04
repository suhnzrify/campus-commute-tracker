import { Bell, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/authContext';
import { useStudents } from '@/hooks/useStudents';

function formatTime(timestamp: number) {
  const diff = Math.floor((Date.now() - timestamp) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function StudentAlerts() {
  const { user } = useAuth();
  const { data: students = [] } = useStudents();
  
  // Find current student to get assigned bus (entityId stores the student profile ID)
  const currentStudent = students.find(s => s.id === user?.entityId);
  const busId = currentStudent?.assignedBusId || 'ALL';

  const { data: notifications = [], isLoading, isError } = useNotifications(busId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold">Notifications</h1>

      {isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Syncing with campus feed...</p>
        </div>
      )}

      {isError && (
        <div className="glass-card rounded-xl p-6 text-center border-l-4 border-l-destructive">
          <AlertTriangle className="w-10 h-10 mx-auto text-destructive mb-2" />
          <p className="text-sm font-semibold">Connection Error</p>
          <p className="text-xs text-muted-foreground">Unable to reach the notification service. Please check your connectivity.</p>
        </div>
      )}

      <div className="space-y-4">
        {notifications.map(n => (
          <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={n.id}
            className={`glass-card rounded-xl p-4 border-l-4 shadow-sm ${
              n.type === 'emergency' ? 'border-l-destructive bg-destructive/5' :
              n.type === 'warning' ? 'border-l-warning bg-warning/5' :
              'border-l-primary bg-primary/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  n.type === 'emergency' ? 'bg-destructive' : n.type === 'warning' ? 'bg-warning' : 'bg-primary'
                }`} />
                <span className="font-display font-bold text-sm tracking-tight">{n.title}</span>
              </div>
              <span className="text-[9px] font-medium text-muted-foreground opacity-60 uppercase tracking-widest">{formatTime(n.timestamp)}</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed ml-4">{n.message}</p>
            <div className="flex items-center gap-2 ml-4 mt-3 pt-2 border-t border-border/30">
               <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                 {n.from_user ? n.from_user.charAt(0).toUpperCase() : 'S'}
               </div>
               <span className="text-[10px] text-muted-foreground font-medium">Broadcast by <span className="text-foreground">{n.from_user || 'System'}</span></span>
            </div>
          </motion.div>
        ))}
      </div>

      {!isLoading && !isError && notifications.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 px-6 glass-card rounded-2xl mx-2 mt-10">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
             <Bell className="w-8 h-8 text-muted-foreground opacity-30" />
          </div>
          <p className="font-display font-bold text-lg mb-1">Stay Tuned!</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">Your campus activity feed is currently clear. Relevant alerts will appear here as they are broadcast.</p>
        </motion.div>
      )}
    </div>
  );
}
