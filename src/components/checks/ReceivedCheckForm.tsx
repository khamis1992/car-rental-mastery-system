import { useState } from 'react';
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
import { Loader2, Receipt, Calendar, DollarSign, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
const receivedCheckSchema = z.object({
  check_number: z.string().min(1, "رقم الشيك مطلوب"),
  drawer_name: z.string().min(1, "اسم الساحب مطلوب"),
  drawer_account: z.string().optional(),
  amount: z.number().min(0.001, "المبلغ يجب أن يكون أكبر من صفر"),
  check_date: z.string().min(1, "تاريخ الشيك مطلوب"),
  received_date: z.string().min(1, "تاريخ الاستلام مطلوب"),
  due_date: z.string().optional(),
  bank_name: z.string().min(1, "اسم البنك مطلوب"),
  memo: z.string().optional(),
  reference_type: z.string().optional(),
  reference_id: z.string().optional(),
});

type ReceivedCheckFormData = z.infer<typeof receivedCheckSchema>;

interface ReceivedCheckFormProps {
  receivedCheck?: any;
  onSuccess: () => void;
}

export function ReceivedCheckForm({ receivedCheck, onSuccess }: ReceivedCheckFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReceivedCheckFormData>({
    resolver: zodResolver(receivedCheckSchema),
    defaultValues: {
      check_number: receivedCheck?.check_number || "",
      drawer_name: receivedCheck?.drawer_name || "",
      drawer_account: receivedCheck?.drawer_account || "",
      amount: receivedCheck?.amount || 0,
      check_date: receivedCheck?.check_date || new Date().toISOString().split('T')[0],
      received_date: receivedCheck?.received_date || new Date().toISOString().split('T')[0],
      due_date: receivedCheck?.due_date || "",
      bank_name: receivedCheck?.bank_name || "",
      memo: receivedCheck?.memo || "",
      reference_type: receivedCheck?.reference_type || "",
      reference_id: receivedCheck?.reference_id || "",
    },
  });

  const onSubmit = async (data: ReceivedCheckFormData) => {
    try {
      setLoading(true);

      // RLS سيتولى إضافة tenant_id تلقائياً
      const checkData = {
        ...data,
        status: 'received',
      };

      let success = false;
      if (receivedCheck) {
        const { error } = await supabase
          .from('received_checks')
          .update(checkData)
          .eq('id', receivedCheck.id);
        success = !error;
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('received_checks')
          .insert([checkData]);
        success = !error;
        if (error) throw error;
      }

      if (success) {
        toast({
          title: 'تم بنجاح',
          description: receivedCheck ? 'تم تحديث الشيك المستلم بنجاح' : 'تم تسجيل الشيك المستلم بنجاح',
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error saving received check:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ الشيك المستلم',
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
          <Receipt className="h-5 w-5" />
          {receivedCheck ? 'تعديل شيك مستلم' : 'تسجيل شيك مستلم جديد'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* معلومات الشيك الأساسية */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold rtl-title flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  معلومات الشيك
                </h3>
                
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
                        />
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

                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="rtl-label">البنك الساحب</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input 
                            placeholder="اسم البنك"
                            {...field}
                            className="pr-10 text-right"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* معلومات الساحب والتواريخ */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold rtl-title flex items-center gap-2">
                  <User className="h-4 w-4" />
                  معلومات الساحب والتواريخ
                </h3>

                <FormField
                  control={form.control}
                  name="drawer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="rtl-label">اسم الساحب</FormLabel>
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
                  name="drawer_account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="rtl-label">رقم حساب الساحب (اختياري)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="رقم الحساب"
                          {...field}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <FormField
                    control={form.control}
                    name="received_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="rtl-label">تاريخ الاستلام</FormLabel>
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

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="rtl-label">تاريخ الاستحقاق (اختياري)</FormLabel>
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
            </div>

            {/* معلومات إضافية */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold rtl-title">معلومات إضافية</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectItem value="contract">عقد</SelectItem>
                          <SelectItem value="payment">دفعة</SelectItem>
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
                          placeholder="رقم الفاتورة أو العقد"
                          {...field}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="rtl-label">ملاحظات</FormLabel>
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
              <Button type="submit" disabled={loading} className="rtl-flex">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'جاري الحفظ...' : receivedCheck ? 'تحديث الشيك' : 'تسجيل الشيك'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}