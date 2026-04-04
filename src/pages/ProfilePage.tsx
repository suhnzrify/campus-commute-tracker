import { motion } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { User, Mail, Shield, AlertTriangle, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 sm:p-6 animate-premium-fade">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">User Account</h1>
        <p className="text-sm text-muted-foreground font-medium">Manage your campus identity and security preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
          
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 relative">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-xl shadow-primary/20 ring-4 ring-white/50">
                 <span className="text-4xl font-display font-bold uppercase">{user.name.charAt(0)}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-2 border-white shadow-sm flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-display font-bold text-foreground">{user.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                 <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-primary text-primary-foreground shadow-sm tracking-widest">{user.role}</span>
                 <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-success/10 text-success border border-success/20 shadow-sm tracking-widest">Active Member</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl premium-surface transition-all hover:shadow-md group/item">
               <div className="p-2.5 rounded-xl bg-primary/5 text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                 <Mail className="w-5 h-5" />
               </div>
               <div className="flex-1">
                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Email Registry</p>
                 <p className="font-semibold text-sm text-foreground truncate">{user.email}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-2xl premium-surface transition-all hover:shadow-md group/item">
               <div className="p-2.5 rounded-xl bg-primary/5 text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                 <Shield className="w-5 h-5" />
               </div>
               <div className="flex-1">
                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Primary Security</p>
                 <p className="font-semibold text-sm text-foreground">Secure Live-OTP</p>
               </div>
            </div>

            {user.entityId && (
              <div className="flex items-center gap-4 p-4 rounded-2xl premium-surface md:col-span-2 transition-all hover:shadow-md group/item">
                 <div className="p-2.5 rounded-xl bg-primary/5 text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                   <User className="w-5 h-5" />
                 </div>
                 <div className="flex-1">
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Identity Registry Serial Number</p>
                   <p className="font-mono font-bold text-sm text-foreground">{user.entityId}</p>
                 </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-6 border-primary/10"
          >
            <h3 className="font-display font-bold flex items-center gap-2 mb-4 text-primary">
               <Key className="w-4 h-4" />
               Security Policy
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground font-medium mb-6">
               Your account is protected by hardware-level Gmail authentication. Static passwords are disabled to prevent credential harvesting. All access requires real-time OTP confirmation.
            </p>
            <Button variant="destructive" className="rounded-2xl w-full font-bold uppercase tracking-wider h-12 shadow-lg shadow-destructive/10" onClick={logout}>Terminate Session</Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-1 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-primary/5"
          >
             <div className="bg-background/40 backdrop-blur-xl rounded-[1.8rem] p-6 border border-white/20">
                <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-2">Cloud Infrastructure</p>
                <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                  Version 2.0.0-PRO (Cloud Edition)<br/>
                  Region: ap-southeast-1 (Singapore)
                </p>
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
