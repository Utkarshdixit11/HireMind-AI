import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials, SignupCredentials } from '../types';

const getApiBase = () => {
  let base = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:5000/api')
    ? import.meta.env.VITE_API_URL
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : `${window.location.origin}/api`);

  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
};

const API_BASE = getApiBase();

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (creds: LoginCredentials) => Promise<void>;
  signup: (creds: SignupCredentials) => Promise<void>;
  logout: () => void;
  loginWithGoogle: (role?: string) => void;
  updateUser: (user: User) => void;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hm_token'));
  const [isLoading, setIsLoading] = useState(true);

  // On mount: handle OAuth redirect params or load existing session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    const oauthUser = params.get('user');
    const oauthError = params.get('error');

    if (oauthToken && oauthUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(oauthUser));
        localStorage.setItem('hm_token', oauthToken);
        setToken(oauthToken);
        setUser(parsedUser);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        // ignore parse error
      }
      setIsLoading(false);
      return;
    }

    if (oauthError) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoading(false);
      return;
    }

    // Load existing session from token
    const storedToken = localStorage.getItem('hm_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid session');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setToken(storedToken);
      })
      .catch(() => {
        localStorage.removeItem('hm_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (creds: LoginCredentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('hm_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (creds: SignupCredentials) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    localStorage.setItem('hm_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const loginAsGuest = useCallback(() => {
    const guestUser: User = {
      _id: 'guest',
      name: 'Guest User',
      email: 'guest@hiremind.ai',
      role: 'guest',
      avatar: null,
      provider: 'local',
      isVerified: false,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('hm_token', 'guest-token');
    setUser(guestUser);
    setToken('guest-token');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hm_token');
    localStorage.removeItem('hm_seeker_resume');
    setToken(null);
    setUser(null);
  }, []);

  const loginWithGoogle = useCallback((role?: string) => {
    const roleParam = role || 'seeker';
    window.location.href = `${API_BASE}/auth/google?role=${roleParam}`;
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      loginWithGoogle,
      updateUser,
      loginAsGuest,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
