import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'driver' | 'student';

interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (role: UserRole, email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const demoUsers: Record<UserRole, AuthUser> = {
  admin: { id: 'a1', name: 'Admin User', role: 'admin', email: 'admin@college.edu' },
  driver: { id: 'd1', name: 'Rajesh Kumar', role: 'driver', email: 'driver@college.edu' },
  student: { id: 'st1', name: 'Arun Prakash', role: 'student', email: 'student@college.edu' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (role: UserRole, _email: string, _password: string) => {
    setUser(demoUsers[role]);
    return true;
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
