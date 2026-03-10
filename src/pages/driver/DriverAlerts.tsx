import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, AlertTriangle, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockNotifications } from '@/lib/mockData';
import { toast } from 'sonner';

const quickAlerts = [
  { label: 'Running Late', icon: Clock, type: 'warning' as const },
  { label: 'Route Change', icon: Navigation, type: 'warning' as const },
  { label: 'Emergency', icon: AlertTriangle, type: 'emergency' as const },
];

export default function DriverAlerts() {
  const [customMessage, setCustomMessage] = useState('');

  const sendAlert = (label: string) => {
    toast.success(`Alert "${label}" sent to all students`);
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
              onClick={() => sendAlert(alert.label)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${
                alert.type === 'emergency' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-warning/10 text-warning hover:bg-warning/20'
              }`}
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
          placeholder="Type a message to send to students..."
          className="w-full h-24 rounded-xl border border-input bg-background p-3 text-sm resize-none"
        />
        <Button
          onClick={() => { sendAlert(customMessage); setCustomMessage(''); }}
          className="w-full mt-2 rounded-xl gap-2"
          disabled={!customMessage.trim()}
        >
          <Send className="w-4 h-4" /> Send to Students
        </Button>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display font-semibold mb-3">Recent Notifications</h3>
        <div className="space-y-2">
          {mockNotifications.map(n => (
            <div key={n.id} className="p-3 rounded-lg bg-muted text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${
                  n.type === 'emergency' ? 'bg-destructive' : n.type === 'warning' ? 'bg-warning' : 'bg-info'
                }`} />
                <span className="font-semibold">{n.title}</span>
              </div>
              <p className="text-muted-foreground text-xs">{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
