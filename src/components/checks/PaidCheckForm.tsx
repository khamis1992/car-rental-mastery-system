import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Calendar, DollarSign, User, Building2, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { CheckFormData } from '@/types/checks';
import { useCheckbooks } from '@/hooks/useCheckbooks';

const paidCheckSchema = z.object({
  checkbook_id: z.string().min(1, "دفتر الشيكات مطلوب"),
  check_number: z.string().min(1, "رقم الشيك مطلوب"),
  payee_name: z.string().min(1, "اسم المستفيد مطلوب"),
  amount: z.number().min(0.001, "المبلغ يجب أن يكون أكبر من صفر"),
  check_date: z.string().min(1, "تاريخ الشيك مطلوب"),
  memo: z.string().optional(),
  reference_type: z.string().optional(),
  reference_id: z.string().optional(),
});

type PaidCheckFormData = z.infer<typeof paidCheckSchema>;

interface PaidCheckFormProps {
  paidCheck?: any;
  onSuccess: () => void;
}

export function PaidCheckForm({ paidCheck, onSuccess }: PaidCheckFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { checkbooks } = useCheckbooks();

  const form = useForm<PaidCheckFormData>({
    resolver: zodResolver(paidCheckSchema),
    defaultValues: {
      checkbook_id: paidCheck?.checkbook_id || "",
      check_number: paidCheck?.check_number || "",
      payee_name: paidCheck?.payee_name || "",
      amount: paidCheck?.amount || 0,
      check_date: paidCheck?.check_date || new Date().toISOString().split('T')[0],
      memo: paidCheck?.memo || "",
      reference_type: paidCheck?.reference_type || "",
      reference_id: paidCheck?.reference_id || "",
    },
  });

  const selectedCheckbook = checkbooks.find(cb => cb.id === form.watch('checkbook_id'));

  // تحديث رقم الشيك التلقائي عند اختيار دفتر شيكات
  useEffect(() => {
    if (selectedCheckbook && !paidCheck) {
      const nextCheckNumber = (selectedCheckbook.start_check_number + selectedCheckbook.used_checks).toString();
      form.setValue('check_number', nextCheckNumber);
    }
  }, [selectedCheckbook, form, paidCheck]);

  const onSubmit = async (data: PaidCheckFormData) => {
    try {
      setLoading(true);

      // التحقق من رقم الشيك
      const checkNumber = parseInt(data.check_number);
      if (selectedCheckbook) {
        if (checkNumber < selectedCheckbook.start_check_number || 
            checkNumber > selectedCheckbook.end_check_number) {
          throw new Error(`رقم الشيك يجب أن يكون بين ${selectedCheckbook.start_check_number} و ${selectedCheckbook.end_check_number}`);
        }
      }

      // الحصول على معلومات دفتر الشيكات للحصول على bank_account_id
      const { data: checkbookData, error: checkbookError } = await supabase
        .from('checkbooks')
        .select('bank_account_id')
        .eq('id', data.checkbook_id)
        .single();

      if (checkbookError) throw checkbookError;

      // RLS سيتولى إضافة tenant_id تلقائياً  
      const checkData = {
        ...data,
        bank_account_id: checkbookData.bank_account_id,
        check_type: 'personal',
        currency: 'KWD',
      };

      let success = false;
      if (paidCheck) {
        const { error } = await supabase
          .from('checks')
          .update(checkData)
          .eq('id', paidCheck.id);
        success = !error;
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('checks')
          .insert([checkData]);
        success = !error;
        if (error) throw error;

        // تحديث عدد الشيكات المستخدمة في دفتر الشيكات
        if (success && selectedCheckbook) {
          await supabase
            .from('checkbooks')
            .update({ 
              used_checks: selectedCheckbook.used_checks + 1,
              remaining_checks: selectedCheckbook.remaining_checks - 1 
            })
            .eq('id', data.checkbook_id);
        }
      }

      if (success) {
        toast({
          title: 'تم بنجاح',
          description: paidCheck ? 'تم تحديث الشيك بنجاح' : 'تم إصدار الشيك بنجاح',
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error saving paid check:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ الشيك',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2">
          <Send className="h-5 w-5" />
          {paidCheck ? 'تعديل شيك مدفوع' : 'إصدار شيك جديد'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* معلومات دفتر الشيكات */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold rtl-title flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  معلومات دفتر الشيكات
                </h3>
                
                <FormField
                  control={form.control}
                  name="checkbook_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="rtl-label">دفتر الشيكات</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر دفتر الشيكات" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {checkbooks
                            .filter(cb => cb.status === 'active' && cb.remaining_checks > 0)
                            .map((checkbook) => (
                              <SelectItem key={checkbook.id} value={checkbook.id}>
                                {checkbook.checkbook_number} - {checkbook.bank_account?.account_name}
                                <span className="text-sm text-muted-foreground mr-2">
                                  ({checkbook.remaining_checks} متبقي)
                                </span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedCheckbook && (
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>البنك:</span>
                        <span className="font-medium">{selectedCheckbook.bank_account?.bank_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>رقم الحساب:</span>
                        <span className="font-medium">{selectedCheckbook.bank_account?.account_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>النطاق:</span>
                        <span className="font-medium">
                          {selectedCheckbook.start_check_number} - {selectedCheckbook.end_check_number}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>المتبقي:</span>
                        <span className="font-medium text-primary">{selectedCheckbook.remaining_checks}</span>
                      </div>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="check_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="rtl-label">رقم الشيك</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="رقم الشيك"
                          {...field}
                          className="text-right"
                          disabled={!selectedCheckbook}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="check_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="rtl-label">تاريخ الشيك</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* معلومات المستفيد والمبلغ */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold rtl-title flex items-center gap-2">
                  <User className="h-4 w-4" />
                  معلومات المستفيد
                </h3>

                <FormField
                  control={form.control}
                  name="payee_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="rtl-label">اسم المستفيد</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input 
                            placeholder="اسم الشخص أو الشركة"
                            {...field}
                            className="pr-10 text-right"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="rtl-label">المبلغ (د.ك)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input 
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="0.000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="pr-10 text-right"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reference_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="rtl-label">نوع المرجع</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع المرجع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="invoice">فاتورة</SelectItem>
                            <SelectItem value="supplier">مورد</SelectItem>
                            <SelectItem value="expense">مصروف</SelectItem>
                            <SelectItem value="salary">راتب</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="rtl-label">رقم المرجع</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="رقم الفاتورة أو المرجع"
                            {...field}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* ملاحظات */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="rtl-label">ملاحظات الشيك</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="أي ملاحظات إضافية..."
                        {...field}
                        className="text-right"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* أزرار الحفظ */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="submit" disabled={loading || !selectedCheckbook} className="rtl-flex">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'جاري الحفظ...' : paidCheck ? 'تحديث الشيك' : 'إصدار الشيك'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}