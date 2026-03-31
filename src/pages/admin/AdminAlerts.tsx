import { useState } from 'react';
import { Send, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications, useSendNotification } from '@/hooks/useNotifications';
import { useBuses } from '@/hooks/useBuses';

function formatTime(timestamp: number) {
  const diff = Math.floor((Date.now() - timestamp) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function AdminAlerts() {
  const { data: notifications = [], isLoading } = useNotifications('ALL');
  const { data: buses = [] } = useBuses();
  const sendNotification = useSendNotification();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'emergency'>('info');
  const [targetBusId, setTargetBusId] = useState('ALL');

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    try {
      await sendNotification.mutateAsync({
        title,
        message,
        type,
        from_user: 'Admin',
        targetBusId,
      });
      setTitle('');
      setMessage('');
      alert('Notification broadcasted successfully!');
    } catch (err) {
      alert('Failed to send notification');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
         <h1 className="text-2xl font-display font-bold">Admin Broadcasts</h1>
         <p className="text-sm text-muted-foreground">Send real-time alerts to specific buses or globally.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
         {/* Compose Section */}
         <div className="glass-card rounded-2xl p-6 h-fit space-y-4 border border-border/50">
           <h2 className="font-display font-bold flex items-center gap-2 text-lg">
             <Send className="w-5 h-5 text-primary" /> Compose Alert
           </h2>
           
           <div className="space-y-4">
             <div>
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-1 block">Target Audience</label>
               <select 
                 className="w-full bg-background rounded-xl p-3 border border-border outline-none text-foreground"
                 value={targetBusId}
                 onChange={e => setTargetBusId(e.target.value)}
               >
                 <option value="ALL">ALL (Global Broadcast)</option>
                 {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.number} - {b.model}</option>
                 ))}
               </select>
             </div>

             <div>
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-1 block">Priority Type</label>
               <select 
                 className="w-full bg-background rounded-xl p-3 border border-border outline-none text-foreground"
                 value={type}
                 onChange={e => setType(e.target.value as any)}
               >
                 <option value="info">Info (Standard)</option>
                 <option value="warning">Warning (Important)</option>
                 <option value="emergency">Emergency (Critical)</option>
               </select>
             </div>

             <div>
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-1 block">Title</label>
               <Input 
                 placeholder="e.g., Campus Event Update" 
                 value={title}
                 onChange={e => setTitle(e.target.value)}
                 className="rounded-xl"
               />
             </div>

             <div>
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-1 block">Message</label>
               <textarea 
                 rows={4}
                 placeholder="Type your detailed message here..." 
                 value={message}
                 onChange={e => setMessage(e.target.value)}
                 className="w-full bg-background rounded-xl p-3 border border-border outline-none text-foreground resize-none"
               />
             </div>

             <Button 
               disabled={!title.trim() || !message.trim() || sendNotification.isPending}
               onClick={handleSend}
               className="w-full rounded-xl h-12 text-lg font-bold mt-2 hover:scale-[1.02] transition-transform"
             >
               {sendNotification.isPending ? 'Transmitting...' : 'Broadcast Alert'}
             </Button>

           </div>
         </div>

         {/* History Section */}
         <div className="space-y-4">
           <h2 className="font-display font-bold flex items-center gap-2 text-lg pl-2">
             <ShieldAlert className="w-5 h-5 text-muted-foreground" /> Sent History
           </h2>
           <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
             {isLoading ? (
               <p className="text-sm text-muted-foreground py-10 text-center">Syncing history...</p>
             ) : notifications.length === 0 ? (
               <div className="text-center py-10 bg-muted/20 rounded-2xl border border-border/50 border-dashed">
                 <ShieldAlert className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                 <p className="text-sm text-muted-foreground italic">No notifications sent yet.</p>
               </div>
             ) : (
                notifications.map(n => (
                  <div key={n.id} className={`bg-background/90 backdrop-blur-md rounded-2xl p-4 border-l-4 shadow-sm hover:shadow-md transition-shadow ${
                    n.type === 'emergency' ? 'border-l-destructive' :
                    n.type === 'warning' ? 'border-l-warning' :
                    'border-l-info'
                  }`}>
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full shadow-sm ${
                          n.type === 'emergency' ? 'bg-destructive shadow-destructive/50' : 
                          n.type === 'warning' ? 'bg-warning shadow-warning/50' : 
                          'bg-info shadow-info/50'
                        }`} />
                        <span className="font-display font-bold">{n.title}</span>
                      </div>
                      <span className="text-[9px] font-bold bg-muted text-muted-foreground tracking-wider px-2 py-1 rounded-md uppercase">
                        {n.targetBusId === 'ALL' ? 'GLOBAL' : `Bus: ${n.targetBusId}`}
                      </span>
                    </div>
                    <p className="text-[13px] text-foreground leading-relaxed">{n.message}</p>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 text-right">
                      {formatTime(n.timestamp)}
                    </div>
                  </div>
                ))
             )}
           </div>
         </div>
      </div>
    </div>
  );
}
