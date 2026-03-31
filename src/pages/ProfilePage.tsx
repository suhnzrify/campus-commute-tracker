import { motion } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { User, Mail, Shield, AlertTriangle, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
             <span className="text-2xl font-display font-bold uppercase">{user.name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">{user.name}</h2>
            <div className="flex gap-2 mt-1">
               <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize tracking-wide">{user.role}</span>
               <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success flex items-center gap-1">✅ Verified</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted text-sm border border-border/50">
             <Mail className="w-4 h-4 text-muted-foreground" />
             <div className="flex-1">
               <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email Account</p>
               <p className="font-medium text-foreground">{user.email}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted text-sm border border-border/50">
             <Shield className="w-4 h-4 text-muted-foreground" />
             <div className="flex-1">
               <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Security Strategy</p>
               <p className="font-medium text-foreground">Secure Live OTP Authentication</p>
             </div>
          </div>
          
          {user.entityId && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted text-sm border border-border/50">
               <User className="w-4 h-4 text-muted-foreground" />
               <div className="flex-1">
                 <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Entity Registry ID</p>
                 <p className="font-medium text-foreground">{user.entityId}</p>
               </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="font-display font-semibold flex items-center gap-2 mb-4">
           <Key className="w-4 h-4 text-primary" />
           Security Actions
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
           Because this system uses secure Live-OTP Email authorization, there is no static password to change. Your account is inherently tied securely to your Gmail inbox!
        </p>
        <Button variant="destructive" className="rounded-xl w-full sm:w-auto" onClick={logout}>Sign Out</Button>
      </motion.div>
    </div>
  );
}
