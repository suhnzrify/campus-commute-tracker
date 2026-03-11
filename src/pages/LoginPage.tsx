import { useState } from 'react';
import { useAuth, UserRole } from '@/lib/authContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Shield, Truck, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const API_BASE = 'http://localhost:4000';

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(selectedRole, email, password);
    setLoading(false);
    if (result.success) {
      navigate(`/${selectedRole}`);
    } else {
      setError(result.error || 'Login failed.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);
    setForgotLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSuccess(true);
      } else {
        setForgotError(data.error || 'Failed to process request.');
      }
    } catch {
      setForgotError('Cannot reach server. Is the backend running?');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    setForgotError('');
    setForgotSuccess(false);
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
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold"
              disabled={loading}
            >
              {loading ? 'Signing in…' : `Sign In as ${roles.find(r => r.role === selectedRole)?.label}`}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-primary hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Default accounts: admin@gmail.com / 1234, student@gmail.com / 1234, driver@gmail.com / 1234
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={closeForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          {forgotSuccess ? (
            <div className="py-4">
              <p className="text-sm text-green-600 text-center">
                If an account exists with this email, a password reset link has been sent.
                Check the server console for the reset token (in development).
              </p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                {forgotError && (
                  <p className="text-sm text-destructive">{forgotError}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeForgotPassword}>
                  Cancel
                </Button>
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
