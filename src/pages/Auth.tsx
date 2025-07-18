import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowLeft, ArrowRight, UserPlus, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {
    signIn,
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signIn(email, password);
      if (result.error) {
        let errorMessage = 'حدث خطأ غير متوقع';
        if (result.error.message?.includes('Invalid login credentials')) {
          errorMessage = 'بيانات تسجيل الدخول غير صحيحة';
        } else if (result.error.message?.includes('Email not confirmed')) {
          errorMessage = 'يجب تأكيد البريد الإلكتروني أولاً';
        }
        setError(errorMessage);
      } else {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في نظام تأجير السيارات"
        });
      }
    } catch (error) {
      console.error('خطأ في المصادقة:', error);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-border p-8">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              <Home className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0066CC] mb-2">
            Fleetify
          </h1>
          <p className="text-muted-foreground text-sm">
            تسجيل الدخول إلى حسابك
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-right block text-foreground font-medium">
              البريد الإلكتروني
            </Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-12 text-right bg-gray-50 border border-input rounded-lg px-4 focus:bg-white focus:border-primary transition-colors" placeholder="admin@example.com" />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-right block text-foreground font-medium">
              كلمة المرور
            </Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="w-full h-12 text-right bg-gray-50 border border-input rounded-lg px-4 pr-12 focus:bg-white focus:border-primary transition-colors" placeholder="أدخل كلمة المرور" />
              <Button type="button" variant="ghost" size="sm" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          {/* Login Button */}
          <Button type="submit" className="w-full h-12 bg-[#0066CC] hover:bg-[#0052A3] text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors mt-8" disabled={loading}>
            {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </form>

        {/* New User Section */}
        

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            تحتاج مساعدة؟ 
            <a href="mailto:support@fleetify.com" className="text-primary hover:underline mr-1">
              تواصل معنا
            </a>
          </p>
        </div>

      </div>
    </div>;
};
export default Auth;