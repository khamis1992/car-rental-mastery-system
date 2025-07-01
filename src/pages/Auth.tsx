import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp, user } = useAuth();
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

    if (!isLogin && password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        if (!fullName.trim()) {
          setError('الاسم الكامل مطلوب');
          setLoading(false);
          return;
        }
        result = await signUp(email, password, fullName);
      }

      if (result.error) {
        let errorMessage = 'حدث خطأ غير متوقع';
        
        if (result.error.message?.includes('Invalid login credentials')) {
          errorMessage = 'بيانات تسجيل الدخول غير صحيحة';
        } else if (result.error.message?.includes('User already registered')) {
          errorMessage = 'المستخدم مسجل مسبقاً';
        } else if (result.error.message?.includes('Password should be at least 6 characters')) {
          errorMessage = 'كلمة المرور يجب أن تكون على الأقل 6 أحرف';
        }
        
        setError(errorMessage);
      } else {
        if (!isLogin) {
          toast({
            title: "تم إنشاء الحساب بنجاح",
            description: "تم إرسال رابط التأكيد إلى بريدك الإلكتروني",
          });
        } else {
          toast({
            title: "تم تسجيل الدخول بنجاح",
            description: "مرحباً بك في نظام تأجير السيارات",
          });
        }
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
            نظام تأجير السيارات
          </CardTitle>
          <CardDescription>
            {isLogin ? 'تسجيل الدخول إلى حسابك' : 'إنشاء حساب جديد'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'signup'} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger 
                value="login" 
                onClick={() => setIsLogin(true)}
                className="flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                تسجيل دخول
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                onClick={() => setIsLogin(false)}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                حساب جديد
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@company.com"
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

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isLogin}
                    placeholder="أعد إدخال كلمة المرور"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading ? 'جاري التحميل...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>للاختبار، يمكنك استخدام:</p>
              <p className="font-mono">admin@company.com</p>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;