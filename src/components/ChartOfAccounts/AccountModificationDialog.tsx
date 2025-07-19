
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { accountModificationService } from '@/services/accountModificationService';
import { ChartOfAccountNode } from '@/types/chartOfAccounts';
import { ModificationRequestFormData } from '@/types/accountModification';
import { AlertTriangle, Lock } from 'lucide-react';

const modificationSchema = z.object({
  request_type: z.enum(['update_code', 'update_name', 'update_type', 'update_category', 'deactivate', 'other']),
  account_code: z.string().optional(),
  account_name: z.string().optional(),
  account_type: z.string().optional(),
  account_category: z.string().optional(),
  justification: z.string().min(10, 'التبرير يجب أن يكون 10 أحرف على الأقل'),
  priority: z.enum(['low', 'normal', 'high', 'urgent'])
});

type ModificationFormData = z.infer<typeof modificationSchema>;

interface AccountModificationDialogProps {
  account: ChartOfAccountNode;
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function AccountModificationDialog({ account, onSuccess, children }: AccountModificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ModificationFormData>({
    resolver: zodResolver(modificationSchema),
    defaultValues: {
      request_type: 'update_name',
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      account_category: account.account_category,
      priority: 'normal',
      justification: ''
    }
  });

  const requestType = form.watch('request_type');

  const onSubmit = async (data: ModificationFormData) => {
    try {
      setLoading(true);

      // تحضير القيم المقترحة بناء على نوع الطلب
      const proposedValues: Record<string, any> = {};
      const currentValues = {
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        account_category: account.account_category
      };

      switch (data.request_type) {
        case 'update_code':
          proposedValues.account_code = data.account_code;
          break;
        case 'update_name':
          proposedValues.account_name = data.account_name;
          break;
        case 'update_type':
          proposedValues.account_type = data.account_type;
          break;
        case 'update_category':
          proposedValues.account_category = data.account_category;
          break;
        case 'deactivate':
          proposedValues.is_active = false;
          break;
      }

      const requestData: ModificationRequestFormData = {
        request_type: data.request_type,
        proposed_values: proposedValues,
        justification: data.justification,
        priority: data.priority
      };

      await accountModificationService.createModificationRequest(
        account.id,
        currentValues,
        requestData
      );

      toast.success('تم إرسال طلب التعديل بنجاح', {
        description: 'سيتم مراجعة الطلب من قبل المدير المالي'
      });

      setOpen(false);
      form.reset();
      onSuccess?.();

    } catch (error) {
      console.error('Error creating modification request:', error);
      toast.error('حدث خطأ أثناء إرسال طلب التعديل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl rtl">
        <DialogHeader>
          <DialogTitle className="rtl-title flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            طلب تعديل حساب مقفل
          </DialogTitle>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">حساب مقفل</h4>
              <p className="text-sm text-amber-700">
                هذا الحساب مقفل لوجود معاملات مالية عليه. يتطلب أي تعديل موافقة من المدير المالي.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">رقم الحساب الحالي</label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                  {account.account_code}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">اسم الحساب الحالي</label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                  {account.account_name}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="request_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع التعديل المطلوب</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع التعديل" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="update_code">تعديل رقم الحساب</SelectItem>
                      <SelectItem value="update_name">تعديل اسم الحساب</SelectItem>
                      <SelectItem value="update_type">تعديل نوع الحساب</SelectItem>
                      <SelectItem value="update_category">تعديل فئة الحساب</SelectItem>
                      <SelectItem value="deactivate">إلغاء تفعيل الحساب</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requestType === 'update_code' && (
              <FormField
                control={form.control}
                name="account_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الحساب الجديد</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="أدخل رقم الحساب الجديد" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {requestType === 'update_name' && (
              <FormField
                control={form.control}
                name="account_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الحساب الجديد</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="أدخل اسم الحساب الجديد" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>أولوية الطلب</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر أولوية الطلب" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="normal">عادية</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التبرير *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="اكتب تبريراً مفصلاً لسبب طلب التعديل..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'جاري الإرسال...' : 'إرسال طلب التعديل'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
