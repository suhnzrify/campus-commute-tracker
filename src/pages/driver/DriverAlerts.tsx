import { useState } from 'react';
import { Bell, Send, AlertTriangle, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { useSendNotification, useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/authContext';
import { useDrivers } from '@/hooks/useDrivers';

const quickAlerts = [
  { label: 'Running Late', icon: Clock, type: 'warning' as const },
  { label: 'Route Change', icon: Navigation, type: 'warning' as const },
  { label: 'Emergency', icon: AlertTriangle, type: 'emergency' as const },
];

export default function DriverAlerts() {
  const [customMessage, setCustomMessage] = useState('');
  
  const { user } = useAuth();
  const { data: drivers = [] } = useDrivers();
  // Find current driver to get assigned bus
  const currentDriver = drivers.find(d => d.id === user?.entityId);
  const targetBusId = currentDriver?.assignedBusId || 'ALL';

  const sendMutation = useSendNotification();
  const { data: recentNotifications = [], isLoading } = useNotifications(targetBusId);

  const sendAlert = (label: string, type: 'info' | 'warning' | 'emergency' = 'info') => {
    sendMutation.mutate({
      title: label === customMessage ? 'Driver Message' : label,
      message: label === customMessage ? customMessage : `Driver reported: ${label}`,
      type,
      from_user: user?.name || 'Driver',
      targetBusId,
    }, {
      onSuccess: () => {
        toast.success(`Alert sent to students`);
        setCustomMessage('');
      },
      onError: (err) => {
        toast.error(`Failed to send alert: ${err.message}`);
      }
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold">Alerts</h1>

      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display font-semibold mb-3">Quick Alerts</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickAlerts.map(alert => (
            <button
              key={alert.label}
              disabled={sendMutation.isPending}
              onClick={() => sendAlert(alert.label, alert.type)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${
                alert.type === 'emergency' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-warning/10 text-warning hover:bg-warning/20'
              } disabled:opacity-50`}
            >
              <alert.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{alert.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display font-semibold mb-3">Custom Message</h3>
        <textarea
          value={customMessage}
          onChange={e => setCustomMessage(e.target.value)}
          disabled={sendMutation.isPending}
          placeholder="Type a message to send to students..."
          className="w-full h-24 rounded-xl border border-input bg-background p-3 text-sm resize-none disabled:opacity-50"
        />
        <Button
          onClick={() => sendAlert(customMessage, 'info')}
          className="w-full mt-2 rounded-xl gap-2"
          disabled={!customMessage.trim() || sendMutation.isPending}
        >
          <Send className="w-4 h-4" /> {sendMutation.isPending ? 'Sending...' : 'Send to Students'}
        </Button>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display font-semibold mb-3 flex justify-between items-center">
          Recent Notifications
          {isLoading && <span className="text-[10px] text-muted-foreground animate-pulse font-normal">Syncing...</span>}
        </h3>
        <div className="space-y-2">
          {!isLoading && recentNotifications.length > 0 ? recentNotifications.map(n => (
            <div key={n.id} className="p-3 rounded-lg bg-muted text-sm border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${
                  n.type === 'emergency' ? 'bg-destructive' : n.type === 'warning' ? 'bg-warning' : 'bg-info'
                }`} />
                <span className="font-semibold text-xs">{n.title}</span>
                <span className="text-[9px] text-muted-foreground ml-auto">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{n.message}</p>
            </div>
          )) : isLoading ? (
            <div className="py-8 text-center bg-muted/30 rounded-lg">
               <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin mx-auto mb-2 rounded-full" />
               <p className="text-[10px] text-muted-foreground">Loading feed...</p>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">No recent notifications</div>
          )}
        </div>
      </div>
    </div>
  );
}
