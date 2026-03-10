import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, type User } from '../api';

type AuthState = { user: User; token: string } | null;

const AuthContext = createContext<{
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
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

  const setUser = useCallback((user: User) => {
    setAuth((prev) => (prev ? { ...prev, user } : prev));
  }, []);

  const refreshUser = useCallback(async () => {
    const token = auth?.token;
    if (!token) return;
    try {
      const user = await authApi.me();
      setAuth({ user, token });
    } catch {
      logout();
    }
  }, [auth?.token, logout]);

  return (
    <AuthContext.Provider value={{ auth, login, register, logout, refreshUser, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
