import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, clearAccessToken, refreshAccessToken } from '../lib/api.js';
import { getGuestCart, clearGuestCart } from '../lib/guestStorage.js';

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

  const syncGuestCartToServer = useCallback(async () => {
    const guestItems = getGuestCart();
    if (!guestItems.length) return;
    for (const item of guestItems) {
      try {
        await api.post('/users/addCartItem', { listingId: Number(item.listingId) });
      } catch {
        // ignore if listing is unavailable or owned by user
      }
    }
    clearGuestCart();
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

  // Silently refresh on mount (deduplicated against React StrictMode) and fetch current user profile
  useEffect(() => {
    let active = true;

    refreshAccessToken()
      .then(async (token) => {
        if (!active) return;
        if (token) {
          await fetchProfile();
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchProfile]);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    setUser(res.data.value);
    await fetchProfile();
    await syncGuestCartToServer();
    return res.data;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data);
    if (res.data.accessToken) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.value);
      await fetchProfile();
      await syncGuestCartToServer();
    } else if (res.data.value) {
      // Signup succeeded without immediate token generation (e.g., pending login / OTP verification)
      setUser(res.data.value);
    }
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
