import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCheckbooks } from "@/hooks/useCheckbooks";
import { supabase } from "@/integrations/supabase/client";

const checkbookSchema = z.object({
  bank_account_id: z.string().min(1, "يجب اختيار حساب بنكي"),
  checkbook_number: z.string().min(1, "رقم دفتر الشيكات مطلوب"),
  start_check_number: z.number().min(1, "رقم الشيك الأول مطلوب"),
  end_check_number: z.number().min(1, "رقم الشيك الأخير مطلوب"),
  issue_date: z.string().min(1, "تاريخ الإصدار مطلوب"),
  notes: z.string().optional(),
}).refine((data) => data.end_check_number > data.start_check_number, {
  message: "رقم الشيك الأخير يجب أن يكون أكبر من رقم الشيك الأول",
  path: ["end_check_number"],
});

type CheckbookFormData = z.infer<typeof checkbookSchema>;

interface CheckbookFormProps {
  checkbook?: any;
  onSuccess: () => void;
}

export function CheckbookForm({ checkbook, onSuccess }: CheckbookFormProps) {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { createCheckbook, updateCheckbook } = useCheckbooks();

  const form = useForm<CheckbookFormData>({
    resolver: zodResolver(checkbookSchema),
    defaultValues: {
      bank_account_id: checkbook?.bank_account_id || "",
      checkbook_number: checkbook?.checkbook_number || "",
      start_check_number: checkbook?.start_check_number || 1,
      end_check_number: checkbook?.end_check_number || 25,
      issue_date: checkbook?.issue_date || new Date().toISOString().split('T')[0],
      notes: checkbook?.notes || "",
    },
  });

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, account_name, bank_name')
        .eq('is_active', true)
        .order('bank_name');

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const onSubmit = async (data: CheckbookFormData) => {
    setLoading(true);
    try {
      let success;
      if (checkbook) {
        success = await updateCheckbook(checkbook.id, data as any);
      } else {
        success = await createCheckbook(data as any);
      }
      
      if (success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving checkbook:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bank_account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="rtl-label">الحساب البنكي</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحساب البنكي" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="checkbook_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="rtl-label">رقم دفتر الشيكات</FormLabel>
              <FormControl>
                <Input placeholder="أدخل رقم دفتر الشيكات" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_check_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="rtl-label">رقم الشيك الأول</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_check_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="rtl-label">رقم الشيك الأخير</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="25"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="issue_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="rtl-label">تاريخ الإصدار</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="rtl-label">ملاحظات</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="ملاحظات إضافية..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'جاري الحفظ...' : checkbook ? 'تحديث' : 'إنشاء'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSuccess}
            className="flex-1"
          >
            إلغاء
          </Button>
        </div>
      </form>
    </Form>
  );
}