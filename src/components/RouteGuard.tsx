import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** يحمي أي مسار إداري — غير مسجّل الدخول يُعاد توجيهه فوراً لصفحة الدخول. */
const RouteGuard = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
