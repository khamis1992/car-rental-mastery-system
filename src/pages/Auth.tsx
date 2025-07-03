import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting to sign in with:', email);
      const result = await signIn(email, password);

      if (result.error) {
        console.error('Sign in error:', result.error);
        let errorMessage = 'حدث خطأ غير متوقع';
        
        if (result.error.message?.includes('Invalid login credentials')) {
          errorMessage = 'بيانات تسجيل الدخول غير صحيحة';
        } else if (result.error.message?.includes('Email not confirmed')) {
          errorMessage = 'يجب تأكيد البريد الإلكتروني أولاً';
        } else if (result.error.message?.includes('Email not confirmed')) {
          errorMessage = 'البريد الإلكتروني غير مؤكد';
        }
        
        setError(errorMessage);
      } else {
        console.log('Sign in successful');
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في نظام تأجير السيارات",
        });
      }
    } catch (error) {
      console.error('خطأ في المصادقة:', error);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-elegant">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            البشائر الخليجية
          </CardTitle>
          <CardDescription>
            تسجيل الدخول إلى حسابك
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@admin.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="أدخل كلمة المرور"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-primary flex items-center gap-2"
              disabled={loading}
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>للاختبار، يمكنك استخدام:</p>
            <p className="font-mono">admin@admin.com</p>
            <p className="text-xs mt-2">تواصل مع المدير لإنشاء حساب جديد</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;