import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isLoginEnabled, setIsLoginEnabled] = useState(true);

  const failedAttemptsRef = useRef(0);
  const lockoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (lockoutTimeoutRef.current) {
        clearTimeout(lockoutTimeoutRef.current);
      }
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const startLockout = () => {
    setIsLoginEnabled(false);
    setErrorMessage(
      `تم تعطيل الدخول مؤقتاً بسبب ${MAX_FAILED_ATTEMPTS} محاولات فاشلة متتالية. حاول مرة أخرى بعد ${LOCKOUT_SECONDS} ثانية.`,
    );

    lockoutTimeoutRef.current = setTimeout(() => {
      failedAttemptsRef.current = 0;
      setIsLoginEnabled(true);
      setErrorMessage('');
    }, LOCKOUT_SECONDS * 1000);
  };

  const registerFailedAttempt = () => {
    failedAttemptsRef.current += 1;
    if (failedAttemptsRef.current >= MAX_FAILED_ATTEMPTS) {
      startLockout();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoginEnabled || isBusy) {
      return;
    }

    if (!username.trim() || !password.trim()) {
      setErrorMessage('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setErrorMessage('');
    setIsBusy(true);
    setIsLoginEnabled(false);

    const result = await login(username.trim(), password);

    if (result.success) {
      failedAttemptsRef.current = 0;
      navigate('/', { replace: true });
      return;
    }

    setErrorMessage(result.message ?? 'بيانات الدخول غير صحيحة');

    // خطأ الاتصال بالشبكة (status = -1 أو 0) لا يُحتسب كمحاولة فاشلة — فقط رفض بيانات فعلي من الخادم.
    if (result.status && result.status > 0) {
      registerFailedAttempt();
    }

    setIsBusy(false);
    if (failedAttemptsRef.current < MAX_FAILED_ATTEMPTS) {
      setIsLoginEnabled(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-primary/20 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-arabic text-xl">لوحة تحكم قلعة الضمان</CardTitle>
          <CardDescription className="font-arabic">تسجيل الدخول للمتابعة</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-arabic">
                اسم المستخدم
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-arabic">
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isBusy}
              />
            </div>

            {errorMessage && (
              <p className="font-arabic text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {errorMessage}
              </p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={!isLoginEnabled || isBusy}>
              {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="font-arabic">دخول</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
