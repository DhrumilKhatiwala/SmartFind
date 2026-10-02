import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('sf_token'));
  const [user, setUser] = useState(() => {
    // Check if there is an active guest session in sessionStorage
    const isGuest = sessionStorage.getItem('sf_is_guest') === 'true';
    if (isGuest) {
      return { id: 'guest', username: 'Guest Shopper', email: 'guest@session.local', isGuest: true };
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount (if registered user)
  useEffect(() => {
    const verifyToken = async () => {
      // If user is guest, no token needed
      if (sessionStorage.getItem('sf_is_guest') === 'true') {
        setUser({ id: 'guest', username: 'Guest Shopper', email: 'guest@session.local', isGuest: true });
        setLoading(false);
        return;
      }
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser({ ...res.data, isGuest: false });
      } catch {
        // Token is invalid or expired
        localStorage.removeItem('sf_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const login = useCallback(async (email, password) => {
    // Clean up any guest session
    sessionStorage.removeItem('sf_is_guest');
    sessionStorage.removeItem('sf_guest_cart');

    const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('sf_token', access_token);
    setToken(access_token);
    setUser({ ...userData, isGuest: false });
    return userData;
  }, []);

  const register = useCallback(async (username, email, password) => {
    // Clean up any guest session
    sessionStorage.removeItem('sf_is_guest');
    sessionStorage.removeItem('sf_guest_cart');

    const res = await axios.post(`${API_BASE_URL}/auth/register`, { username, email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('sf_token', access_token);
    setToken(access_token);
    setUser({ ...userData, isGuest: false });
    return userData;
  }, []);

  const loginAsGuest = useCallback(() => {
    // Clear any persistent registered token
    localStorage.removeItem('sf_token');
    setToken(null);
    sessionStorage.setItem('sf_is_guest', 'true');
    const guestUser = { id: 'guest', username: 'Guest Shopper', email: 'guest@session.local', isGuest: true };
    setUser(guestUser);
    return guestUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sf_token');
    sessionStorage.removeItem('sf_is_guest');
    sessionStorage.removeItem('sf_guest_cart');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isGuest: !!user?.isGuest,
    login,
    register,
    loginAsGuest,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
