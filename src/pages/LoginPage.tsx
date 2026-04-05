import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/lib/authContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Shield, Truck, GraduationCap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

const roles: { role: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
  { role: 'admin', label: 'Admin', icon: Shield, desc: 'Manage buses, routes & users' },
  { role: 'driver', label: 'Driver', icon: Truck, desc: 'Start trips & share location' },
  { role: 'student', label: 'Student', icon: GraduationCap, desc: 'Track your bus live' },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedRole = localStorage.getItem('rememberedRole') as UserRole;
    if (rememberedEmail) setEmail(rememberedEmail);
    if (rememberedRole && ['admin', 'driver', 'student'].includes(rememberedRole)) {
      setSelectedRole(rememberedRole);
    }
  }, []);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Email is required.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError('Please enter a valid email address.');

    setLoading(true);
    try {
      // We try the request, but we ALWAYS move to the OTP step for the demo
      await requestOtp(selectedRole, email);
      setStep('otp');
    } catch (err) {
      console.warn("Network issue, forcing OTP step for bypass demo.");
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) return setError('Please enter the 6-digit OTP code.');

    // Server will handle the 000000 master code natively

    setLoading(true);
    try {
      const result = await verifyOtp(selectedRole, email, otp);
      if (result.success) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedRole', selectedRole);
        navigate(`/${selectedRole}`);
      } else {
        setError(result.error || 'Invalid OTP code.');
      }
    } catch (err) {
      setError('Network error. Use master code 000000 for demo.');
    } finally {
      setLoading(false);
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

        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {roles.map(({ role, label, icon: Icon }) => (
                    <button
                      key={role}
                      type="button"
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

                <p className="text-center text-sm text-muted-foreground mb-4">
                  {roles.find(r => r.role === selectedRole)?.desc}
                </p>

                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                  {error && <p className="text-sm text-destructive text-center">{error}</p>}
                  
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Sending OTP…' : 'Request Login OTP'}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center"
              >
                <div className="w-full flex justify-start mb-2 mt-[-10px] ml-[-10px]">
                  <button
                    onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors float-left"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
                
                <Shield className="w-12 h-12 text-primary mb-4" />
                
                <h2 className="text-xl font-bold mb-2">Check your Terminal</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  We've simulated sending a securely generated 6-digit OTP to <br/><span className="font-semibold text-foreground">{email}</span>.
                </p>
                
                <form onSubmit={handleVerifyOTP} className="w-full space-y-6 flex flex-col items-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>

                  {error && <p className="text-sm text-destructive text-center w-full">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-semibold"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? 'Verifying…' : 'Verify & Login'}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Check your backend terminal (Render Dashboard) for your OTP pins.
        </p>

      </motion.div>
    </div>
  );
}