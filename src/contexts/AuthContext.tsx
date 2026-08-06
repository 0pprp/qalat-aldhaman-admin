import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch, ApiError, setAuthToken, setUnauthorizedHandler } from '@/lib/api';
import type { AdminLoginResponse } from '@/types/admin';

interface AuthUser {
  username: string;
  fullName: string;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  /** 0 يعني خطأ اتصال/شبكة (لا يُحتسب كمحاولة فاشلة) — أي رقم آخر رد HTTP فعلي من الخادم. */
  status?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * الجلسة تُحفَظ بالذاكرة فقط (useState) — لا localStorage ولا sessionStorage، فتُفرَّغ تلقائياً
 * عند إغلاق التبويب أو إعادة التحميل (نفس فلسفة WPF SessionService الأصلية).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  // أي رد 401 من أي نداء API بأي شاشة يُنهي الجلسة تلقائياً (توكن منتهي/مرفوض بالخادم).
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await apiFetch<AdminLoginResponse>('/api/admin/auth/login', {
        method: 'POST',
        body: { username, password },
      });

      setAuthToken(result.token);
      setUser({ username: result.username, fullName: result.fullName });
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, message: err.message, status: err.status };
      }
      return { success: false, message: 'حدث خطأ غير متوقع، حاول مرة أخرى', status: -1 };
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
