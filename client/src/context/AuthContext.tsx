import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, type User } from '../api';

type AuthState = { user: User; token: string } | null;

const AuthContext = createContext<{
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(null);
  const [loading, setLoading] = useState(true);

  const loadStored = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const user = await authApi.me();
      setAuth({ user, token });
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('token', res.token);
    setAuth({ user: res.user, token: res.token });
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await authApi.register(email, password, name);
    localStorage.setItem('token', res.token);
    setAuth({ user: res.user, token: res.token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuth(null);
  };

  const refreshUser = useCallback(async () => {
    if (!auth?.token) return;
    try {
      const user = await authApi.me();
      setAuth({ user, token: auth.token });
    } catch {
      logout();
    }
  }, [auth?.token]);

  return (
    <AuthContext.Provider value={{ auth, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
