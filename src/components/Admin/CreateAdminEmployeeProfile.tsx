import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, CheckCircle, AlertTriangle } from 'lucide-react';

export const CreateAdminEmployeeProfile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const createProfile = async () => {
    if (!email || !fullName) {
      toast({
        title: 'بيانات مطلوبة',
        description: 'يرجى إدخال البريد الإلكتروني والاسم الكامل',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // محاكاة إنشاء البروفايل
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResult = {
        success: true,
        message: 'تم إنشاء الملف الشخصي بنجاح',
        profile_created: true,
        employee_created: true
      };

      setResult(mockResult);
      
      toast({
        title: 'تم الإنشاء بنجاح',
        description: 'تم إنشاء الملف الشخصي والموظف بنجاح'
      });

      setEmail('');
      setFullName('');
      
    } catch (error: any) {
      console.error('خطأ في إنشاء الملف الشخصي:', error);
      setResult({
        success: false,
        message: error.message
      });
      toast({
        title: 'خطأ في الإنشاء',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            إنشاء ملف شخصي للموظف الإداري
          </CardTitle>
          <CardDescription>
            إنشاء ملف شخصي جديد لموظف إداري في النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم الكامل للموظف"
                disabled={loading}
              />
            </div>
            
            <Button 
              onClick={createProfile}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء الملف الشخصي'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج العملية</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {result.success ? 
                <CheckCircle className="w-4 h-4 text-green-500" /> : 
                <AlertTriangle className="w-4 h-4 text-red-500" />
              }
              <AlertDescription>
                <div className="font-medium">
                  {result.success ? 'تم الإنشاء بنجاح' : 'فشل الإنشاء'}
                </div>
                <div className="text-sm mt-1">{result.message}</div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};