import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from './api';

export type UserRole = 'admin' | 'driver' | 'student';

// Derive base server URL (strip /api suffix so we can call /api/auth/...)
const API_BASE = API_URL.replace(/\/api$/, '');

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  entityId?: string;
  busId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (role: UserRole, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  requestOtp: (role: UserRole, email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (role: UserRole, email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('authUser');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('authUser');
      }
    }
    setIsInitializing(false);
  }, []);

  const login = async (
    role: UserRole,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(email ?? '').trim(),
          password: String(password ?? ''),
          role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data && typeof data.error === 'string') ? data.error : 'Login failed.';
        return { success: false, error: msg };
      }
      if (data.user) {
        localStorage.setItem('authUser', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server.' };
    } catch {
      return { success: false, error: 'Cannot reach server. Is the backend running?' };
    }
  };

  const requestOtp = async (role: UserRole, email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email).trim(), role })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to request OTP.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Cannot reach server. Is the backend running?' };
    }
  };

  const verifyOtp = async (role: UserRole, email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email).trim(), code: String(code).trim(), role })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid OTP code.' };
      }
      if (data.user) {
        localStorage.setItem('authUser', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server.' };
    } catch {
      return { success: false, error: 'Cannot reach server.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('authUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, requestOtp, verifyOtp, logout, isAuthenticated: !!user, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

