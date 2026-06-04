'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('anjir-token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('anjir-token');
      }
    } catch (e) {
      console.error('Auth check failed:', e);
    }
    setLoading(false);
  };

  const login = async (phone, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('anjir-token', data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const register = async (name, phone, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('anjir-token', data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const logout = () => {
    localStorage.removeItem('anjir-token');
    setUser(null);
  };

  const toggleSaveBook = async (bookId) => {
    const token = localStorage.getItem('anjir-token');
    if (!token || !user) return false;

    const isSaved = user.savedBooks?.includes(bookId);
    const res = await fetch('/api/saved', {
      method: isSaved ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookId })
    });

    if (res.ok) {
      const data = await res.json();
      setUser(prev => ({ ...prev, savedBooks: data.savedBooks }));
      return true;
    }
    return false;
  };

  const isBookSaved = (bookId) => {
    return user?.savedBooks?.includes(bookId) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      toggleSaveBook,
      isBookSaved,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
