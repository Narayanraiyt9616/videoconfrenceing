import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('meethub_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('meethub_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('[AuthContext] Session expired:', err.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.success && res.token) {
        localStorage.setItem('meethub_token', res.token);
        setToken(res.token);
        setUser(res.user);
        toast.success(`Welcome back, ${res.user.name}! 👋`);
        return { success: true };
      }
      throw new Error(res.error || 'Login failed');
    } catch (err) {
      toast.error(err.message || 'Login failed');
      return { success: false, error: err.message };
    }
  };

  const register = async ({ name, email, password, role = 'user', avatar = '👨‍💻', department = '' }) => {
    try {
      const res = await api.post('/api/auth/register', {
        name,
        email,
        password,
        role,
        avatar,
        department
      });
      if (res.success && res.token) {
        localStorage.setItem('meethub_token', res.token);
        setToken(res.token);
        setUser(res.user);
        toast.success(`Account created! Welcome, ${res.user.name} 🎉`);
        return { success: true };
      }
      throw new Error(res.error || 'Registration failed');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('meethub_token');
    setToken(null);
    setUser(null);
    toast('Signed out', { icon: '👋' });
  };

  const updateProfile = async (updates) => {
    try {
      const res = await api.put('/api/auth/profile', updates);
      if (res.success && res.user) {
        setUser(res.user);
        toast.success('Profile updated successfully! ✨');
        return { success: true };
      }
      throw new Error(res.error || 'Failed to update profile');
    } catch (err) {
      toast.error(err.message);
      return { success: false, error: err.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.put('/api/auth/change-password', { currentPassword, newPassword });
      if (res.success) {
        toast.success('Password changed successfully! 🔒');
        return { success: true };
      }
      throw new Error(res.error || 'Failed to change password');
    } catch (err) {
      toast.error(err.message);
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
