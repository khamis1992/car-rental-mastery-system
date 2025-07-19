import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowLeft, Home } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        {/* Back to Home */}
        <div className="flex items-center justify-center gap-2 mb-6 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">العودة للرئيسية</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1976D2] mb-2">
            Fleetify
          </h1>
          <p className="text-gray-500 text-base">
            تسجيل الدخول إلى حسابك
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-right block text-gray-700 font-medium text-base">
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-14 text-right bg-gray-50 border border-gray-200 rounded-xl px-4 focus:bg-white focus:border-blue-400 transition-colors text-gray-600"
              placeholder="admin@example.com"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-right block text-gray-700 font-medium text-base">
              كلمة المرور
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-14 text-right bg-gray-50 border border-gray-200 rounded-xl px-4 pr-12 focus:bg-white focus:border-blue-400 transition-colors text-gray-600"
                placeholder="أدخل كلمة المرور"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            className="w-full h-14 bg-[#1976D2] hover:bg-[#1565C0] text-white font-semibold rounded-xl flex items-center justify-center gap-3 transition-colors mt-8 text-base"
            disabled={loading}
          >
            <ArrowLeft className="w-5 h-5" />
            {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
          </Button>
        </form>

        {/* Contact Us Link */}
        <div className="text-center mt-8">
          <span className="text-gray-500 text-sm">
            تحتاج مساعدة؟{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              تواصل معنا
            </a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;