import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student } from '../types';
import { safeFetch } from '../lib/api';

interface AuthContextType {
  user: Student | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (identifier: string, passwordPlain: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (extra?: { enrollmentNumber?: string; mobileNumber?: string; program?: string }) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (userId: string, passwordPlain: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    enrollmentNumber: string;
    mobileNumber: string;
    program: string;
    passwordPlain: string;
    courseYear?: string;
    studyCenterCode?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(() => {
    try {
      const stored = localStorage.getItem('ignou_student_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ignou_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAdmin = user?.role === 'admin';

  const getAuthHeaders = (): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Validate and synchronize session on initial load with automatic session recovery
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('ignou_auth_token');
      const cachedProfileStr = localStorage.getItem('ignou_student_profile');
      let cachedProfile: Student | null = null;
      try {
        if (cachedProfileStr) cachedProfile = JSON.parse(cachedProfileStr);
      } catch {}

      if (storedToken) {
        try {
          const res = await safeFetch<{ user: Student }>('/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (res.ok && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('ignou_student_profile', JSON.stringify(res.data.user));
          } else if (cachedProfile) {
            // Attempt silent session recovery
            const refreshRes = await safeFetch<{ token: string; user: Student }>('/auth/refresh-session', {
              method: 'POST',
              body: JSON.stringify({
                studentId: cachedProfile.id,
                email: cachedProfile.email,
                enrollmentNumber: cachedProfile.enrollmentNumber
              })
            });
            if (refreshRes.ok && refreshRes.data?.token && refreshRes.data?.user) {
              setToken(refreshRes.data.token);
              setUser(refreshRes.data.user);
              localStorage.setItem('ignou_auth_token', refreshRes.data.token);
              localStorage.setItem('ignou_student_profile', JSON.stringify(refreshRes.data.user));
            }
          }
        } catch {
          // If offline or network issue, maintain cached profile
        }
      } else if (cachedProfile) {
        // Automatically restore session from cached student profile
        try {
          const refreshRes = await safeFetch<{ token: string; user: Student }>('/auth/refresh-session', {
            method: 'POST',
            body: JSON.stringify({
              studentId: cachedProfile.id,
              email: cachedProfile.email,
              enrollmentNumber: cachedProfile.enrollmentNumber
            })
          });
          if (refreshRes.ok && refreshRes.data?.token && refreshRes.data?.user) {
            setToken(refreshRes.data.token);
            setUser(refreshRes.data.user);
            localStorage.setItem('ignou_auth_token', refreshRes.data.token);
            localStorage.setItem('ignou_student_profile', JSON.stringify(refreshRes.data.user));
          }
        } catch {}
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (identifier: string, passwordPlain: string) => {
    try {
      const result = await safeFetch<{ token: string; user: Student; sessionId?: string }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password: passwordPlain })
      });

      if (result.ok && result.data?.token && result.data?.user) {
        const userToken = result.data.token;
        const userObj = result.data.user;

        setToken(userToken);
        setUser(userObj);
        localStorage.setItem('ignou_auth_token', userToken);
        localStorage.setItem('ignou_student_profile', JSON.stringify(userObj));
        if (result.data.sessionId) {
          localStorage.setItem('ignou_active_session_id', result.data.sessionId);
        }

        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Invalid credentials. Please verify your Email or Enrollment Number.'
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const loginWithGoogle = async () => {
    return {
      success: false,
      error: 'Please sign in with your IGNOU Enrollment Number or registered Email address.'
    };
  };

  const adminLogin = async (userId: string, passwordPlain: string) => {
    try {
      const result = await safeFetch<{ token: string; user: Student; sessionId?: string }>('/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim(), password: passwordPlain })
      });

      if (result.ok && result.data?.token && result.data?.user) {
        const adminToken = result.data.token;
        const adminUser = result.data.user;

        setToken(adminToken);
        setUser(adminUser);
        localStorage.setItem('ignou_auth_token', adminToken);
        localStorage.setItem('ignou_student_profile', JSON.stringify(adminUser));
        if (result.data.sessionId) {
          localStorage.setItem('ignou_active_session_id', result.data.sessionId);
        }

        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Access Denied: Invalid Administrator credentials.'
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error during admin authentication' };
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    enrollmentNumber: string;
    mobileNumber: string;
    program: string;
    passwordPlain: string;
    courseYear?: string;
    studyCenterCode?: string;
  }) => {
    try {
      const result = await safeFetch<{ token: string; user: Student; sessionId?: string }>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          enrollmentNumber: data.enrollmentNumber.trim().toUpperCase(),
          mobileNumber: data.mobileNumber.trim(),
          program: data.program.trim(),
          password: data.passwordPlain,
          courseYear: data.courseYear || '1st Year',
          studyCenterCode: data.studyCenterCode || 'SC-0700'
        })
      });

      if (result.ok && result.data?.token && result.data?.user) {
        const userToken = result.data.token;
        const studentObj = result.data.user;

        setToken(userToken);
        setUser(studentObj);
        localStorage.setItem('ignou_auth_token', userToken);
        localStorage.setItem('ignou_student_profile', JSON.stringify(studentObj));
        if (result.data.sessionId) {
          localStorage.setItem('ignou_active_session_id', result.data.sessionId);
        }

        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Registration failed. Please check your details and try again.'
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error during student registration' };
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
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Logout notice:', err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('ignou_auth_token');
      localStorage.removeItem('ignou_student_profile');
      localStorage.removeItem('ignou_active_session_id');
      localStorage.removeItem('ignou_active_session_login_time');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        isLoading,
        login,
        loginWithGoogle,
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
