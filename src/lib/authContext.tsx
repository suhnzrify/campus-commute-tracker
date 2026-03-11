import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'driver' | 'student';

const API_BASE = 'http://localhost:4001';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (role: UserRole, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

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
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server.' };
    } catch {
      return { success: false, error: 'Cannot reach server. Is the backend running?' };
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
