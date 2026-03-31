import { Bell } from 'lucide-react';
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

  const { data: notifications = [], isLoading } = useNotifications(busId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold">Notifications</h1>

      {isLoading && <p className="text-sm text-muted-foreground">Loading notifications...</p>}

      <div className="space-y-2">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`glass-card rounded-xl p-4 border-l-4 ${
              n.type === 'emergency' ? 'border-l-destructive' :
              n.type === 'warning' ? 'border-l-warning' :
              'border-l-info'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${
                n.type === 'emergency' ? 'bg-destructive' : n.type === 'warning' ? 'bg-warning' : 'bg-info'
              }`} />
              <span className="font-display font-semibold text-sm">{n.title}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                n.type === 'emergency' ? 'bg-destructive/10 text-destructive' :
                n.type === 'warning' ? 'bg-warning/10 text-warning' :
                'bg-info/10 text-info'
              }`}>{n.type}</span>
            </div>
            <p className="text-sm text-muted-foreground ml-4">{n.message}</p>
            <p className="text-[10px] text-muted-foreground/60 ml-4 mt-1">From: {n.from_user} · {formatTime(n.timestamp)}</p>
          </div>
        ))}
      </div>

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      )}
    </div>
  );
}
