import { useState } from 'react';
import { useAuth, UserRole } from '@/lib/authContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Shield, Truck, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const roles: { role: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
  { role: 'admin', label: 'Admin', icon: Shield, desc: 'Manage buses, routes & users' },
  { role: 'driver', label: 'Driver', icon: Truck, desc: 'Start trips & share location' },
  { role: 'student', label: 'Student', icon: GraduationCap, desc: 'Track your bus live' },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(selectedRole, email, password)) {
      navigate(`/${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl stat-gradient flex items-center justify-center">
            <Bus className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">BusTrack</h1>
            <p className="text-xs text-muted-foreground">College Bus Tracking System</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="grid grid-cols-3 gap-2 mb-6">
            {roles.map(({ role, label, icon: Icon }) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all text-sm font-medium ${
                  selectedRole === role
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={selectedRole}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-muted-foreground mb-4"
            >
              {roles.find(r => r.role === selectedRole)?.desc}
            </motion.p>
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-12 rounded-xl"
            />
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-12 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold">
              Sign In as {roles.find(r => r.role === selectedRole)?.label}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Demo: Enter any email/password to login
          </p>
        </div>
      </motion.div>
    </div>
  );
}
