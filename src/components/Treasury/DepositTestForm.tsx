import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader, DollarSign, CheckCircle, XCircle } from 'lucide-react';

const DepositTestForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: 100,
    description: 'إيداع تجريبي للاختبار',
    bank_account_id: '',
    payment_method: 'bank'
  });

  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  // جلب حسابات البنوك
  React.useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('id, account_name, bank_name')
          .eq('is_active', true)
          .order('account_name');

        if (error) {
          console.error('خطأ في جلب حسابات البنوك:', error);
        } else {
          setBankAccounts(data || []);
        }
      } catch (error) {
        console.error('خطأ في استدعاء حسابات البنوك:', error);
      }
    };

    fetchBankAccounts();
  }, []);

  const runDepositTest = async () => {
    setLoading(true);
    setTestResult(null);
    console.log('🧪 بدء اختبار الإيداع المتقدم...');

    const steps = [];

    try {
      // الخطوة 1: التحقق من المصادقة والمؤسسة
      console.log('🔍 فحص المصادقة والمؤسسة...');
      const { data: userInfo, error: userError } = await supabase.rpc('get_current_user_info');
      
      if (userError) {
        steps.push({
          step: 'التحقق من المصادقة',
          status: 'error',
          message: userError.message
        });
        return;
      }

      const currentUser = userInfo as any;
      steps.push({
        step: 'التحقق من المصادقة',
        status: 'success',
        message: `المستخدم مصادق عليه - معرف المؤسسة: ${currentUser.tenant_id}`
      });

      // الخطوة 2: التحقق من صلاحيات المستخدم
      console.log('🛡️ فحص صلاحيات المستخدم...');
      const { data: userRoles, error: rolesError } = await supabase
        .from('tenant_user_roles')
        .select('role')
        .eq('user_id', currentUser.user_id)
        .eq('is_active', true);

      if (rolesError) {
        steps.push({
          step: 'فحص الصلاحيات',
          status: 'error',
          message: rolesError.message
        });
      } else {
        const roles = userRoles?.map(r => r.role) || [];
        steps.push({
          step: 'فحص الصلاحيات',
          status: roles.length > 0 ? 'success' : 'warning',
          message: `الأدوار: ${roles.join(', ') || 'لا توجد أدوار'}`
        });
      }

      // الخطوة 3: فحص وجود حسابات البنوك
      console.log('🏦 فحص حسابات البنوك...');
      if (bankAccounts.length === 0) {
        steps.push({
          step: 'فحص حسابات البنوك',
          status: 'warning',
          message: 'لا توجد حسابات بنوك نشطة'
        });
      } else {
        steps.push({
          step: 'فحص حسابات البنوك',
          status: 'success',
          message: `تم العثور على ${bankAccounts.length} حساب بنكي`
        });
      }

      // الخطوة 4: اختبار إنشاء قيد محاسبي مباشر
      console.log('📊 اختبار إنشاء قيد محاسبي تجريبي...');
      
      // محاولة إنشاء قيد محاسبي تجريبي بسيط
      const journalData = {
        entry_number: `TEST-${Date.now()}`,
        entry_date: new Date().toISOString().split('T')[0],
        description: `قيد اختبار - ${formData.description}`,
        reference_type: 'test',
        total_debit: formData.amount,
        total_credit: formData.amount,
        status: 'posted'
      };

      console.log('📋 بيانات القيد التجريبي:', journalData);

      const { data: journal, error: journalError } = await supabase
        .from('journal_entries')
        .insert([journalData])
        .select()
        .single();

      if (journalError) {
        steps.push({
          step: 'إنشاء قيد محاسبي',
          status: 'error',
          message: `فشل إنشاء القيد: ${journalError.message}`,
          details: journalError
        });
      } else {
        steps.push({
          step: 'إنشاء قيد محاسبي',
          status: 'success',
          message: `تم إنشاء القيد بنجاح - المعرف: ${journal.id}`,
          details: journal
        });

        // الخطوة 5: إنشاء سطور القيد
        console.log('📝 إنشاء سطور القيد المحاسبي...');
        
        // الحصول على حسابات للاختبار
        const { data: accounts, error: accountsError } = await supabase
          .from('chart_of_accounts')
          .select('id, account_code, account_name, account_type')
          .eq('allow_posting', true)
          .limit(2);

        if (accountsError || !accounts || accounts.length < 2) {
          steps.push({
            step: 'جلب الحسابات للاختبار',
            status: 'error',
            message: 'لا توجد حسابات كافية للاختبار'
          });
        } else {
          // إنشاء سطري مدين ودائن
          const journalLines = [
            {
              journal_entry_id: journal.id,
              account_id: accounts[0].id,
              description: 'طرف مدين - اختبار',
              debit_amount: formData.amount,
              credit_amount: 0,
              line_number: 1
            },
            {
              journal_entry_id: journal.id,
              account_id: accounts[1].id,
              description: 'طرف دائن - اختبار',
              debit_amount: 0,
              credit_amount: formData.amount,
              line_number: 2
            }
          ];

          const { data: lines, error: linesError } = await supabase
            .from('journal_entry_lines')
            .insert(journalLines)
            .select();

          if (linesError) {
            steps.push({
              step: 'إنشاء سطور القيد',
              status: 'error',
              message: `فشل إنشاء السطور: ${linesError.message}`
            });
          } else {
            steps.push({
              step: 'إنشاء سطور القيد',
              status: 'success',
              message: `تم إنشاء ${lines?.length || 0} سطر بنجاح`,
              details: lines
            });
          }
        }

        // تنظيف: حذف البيانات التجريبية
        console.log('🧹 تنظيف البيانات التجريبية...');
        
        try {
          // حذف سطور القيد أولاً
          await supabase.from('journal_entry_lines').delete().eq('journal_entry_id', journal.id);
          // ثم حذف القيد نفسه
          await supabase.from('journal_entries').delete().eq('id', journal.id);
          
          steps.push({
            step: 'تنظيف البيانات',
            status: 'success',
            message: 'تم حذف البيانات التجريبية بنجاح'
          });
        } catch (cleanupError: any) {
          steps.push({
            step: 'تنظيف البيانات',
            status: 'warning',
            message: `تحذير في التنظيف: ${cleanupError.message}`
          });
        }
      }

    } catch (error: any) {
      console.error('❌ خطأ في اختبار الإيداع:', error);
      steps.push({
        step: 'خطأ عام',
        status: 'error',
        message: error.message || 'خطأ غير معروف'
      });
    } finally {
      setTestResult({ steps, timestamp: new Date() });
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <CheckCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            اختبار إنشاء الإيداعات والقيود المحاسبية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المبلغ (د.ك)</Label>
              <Input
                type="number"
                step="0.001"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="100.000"
              />
            </div>
            
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="bank">حوالة بنكية</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.payment_method === 'bank' && (
            <div className="space-y-2">
              <Label>الحساب البنكي</Label>
              <Select value={formData.bank_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, bank_account_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب البنكي" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} - {account.bank_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف الإيداع"
              rows={2}
            />
          </div>

          <Button 
            onClick={runDepositTest} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            تشغيل اختبار شامل للإيداع
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج الاختبار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {testResult.steps.map((step: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(step.status)}
                <div className="flex-1">
                  <div className="font-medium">{step.step}</div>
                  <div className="text-sm text-muted-foreground">{step.message}</div>
                  {step.details && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer text-primary">عرض التفاصيل</summary>
                      <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DepositTestForm;