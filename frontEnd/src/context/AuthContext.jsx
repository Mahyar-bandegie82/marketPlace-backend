import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, clearAccessToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      return res.data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    clearAccessToken();
    setUser(null);
  }, []);

  // Listen for forced logout from the interceptor
  useEffect(() => {
    const handler = () => {
      setUser(null);
      clearAccessToken();
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // Try to silently refresh on mount and fetch current user profile
  useEffect(() => {
    api
      .put('/auth/refresh')
      .then(async (res) => {
        setAccessToken(res.data.accessToken);
        await fetchProfile();
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [fetchProfile]);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    setAccessToken(res.data.accessToken);
    setUser(res.data.value);
    // Fetch full enriched profile
    await fetchProfile();
    return res.data;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data);
    setAccessToken(res.data.accessToken);
    setUser(res.data.value);
    await fetchProfile();
    return res.data;
  };

  const updateUser = (userData) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, setUser, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
