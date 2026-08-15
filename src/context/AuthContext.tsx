import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student } from '../types';
import { safeFetch, buildApiUrl } from '../lib/api';

interface AuthContextType {
  user: Student | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, passwordPlain: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (userId: string, passwordPlain: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    enrollmentNumber: string;
    mobileNumber: string;
    program: string;
    passwordPlain: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ignou_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getAuthHeaders = (): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await safeFetch<{ user: Student }>('/auth/me');
        if (result.ok && result.data?.user) {
          setUser(result.data.user);
        } else {
          // Token expired or invalid
          setToken(null);
          setUser(null);
          localStorage.removeItem('ignou_auth_token');
        }
      } catch (err) {
        console.error('Failed to verify session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (identifier: string, passwordPlain: string) => {
    try {
      const result = await safeFetch<{ token: string; user: Student }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: passwordPlain })
      });

      if (!result.ok || !result.data?.token) {
        return { success: false, error: result.error || 'Login failed' };
      }

      setToken(result.data.token);
      setUser(result.data.user);
      localStorage.setItem('ignou_auth_token', result.data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const adminLogin = async (userId: string, passwordPlain: string) => {
    try {
      const result = await safeFetch<{ token: string; user: Student }>('/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: passwordPlain })
      });

      if (!result.ok || !result.data?.token) {
        return { success: false, error: result.error || 'Admin authentication failed' };
      }

      setToken(result.data.token);
      setUser(result.data.user);
      localStorage.setItem('ignou_auth_token', result.data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during admin login' };
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    enrollmentNumber: string;
    mobileNumber: string;
    program: string;
    passwordPlain: string;
  }) => {
    try {
      const result = await safeFetch<{ token: string; user: Student }>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          enrollmentNumber: data.enrollmentNumber,
          mobileNumber: data.mobileNumber,
          program: data.program,
          password: data.passwordPlain
        })
      });

      if (!result.ok || !result.data?.token) {
        return { success: false, error: result.error || 'Registration failed' };
      }

      setToken(result.data.token);
      setUser(result.data.user);
      localStorage.setItem('ignou_auth_token', result.data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await safeFetch('/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.warn('Logout API notification failed:', err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('ignou_auth_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        adminLogin,
        register,
        logout,
        getAuthHeaders
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

