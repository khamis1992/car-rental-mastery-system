import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Shield, DollarSign, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { VehicleInsurance } from '@/repositories/interfaces/IVehicleInsuranceRepository';
import { INSURANCE_TYPES } from '@/lib/insuranceUtils';

const insuranceSchema = z.object({
  insurance_type: z.enum(['comprehensive', 'third_party', 'basic', 'collision', 'theft', 'fire', 'natural_disasters']),
  insurance_company: z.string().optional(),
  policy_number: z.string().optional(),
  start_date: z.string().optional(),
  expiry_date: z.string().optional(),
  premium_amount: z.number().min(0, 'المبلغ لا يمكن أن يكون سالباً').optional(),
  coverage_amount: z.number().min(0, 'المبلغ لا يمكن أن يكون سالباً').optional(),
  deductible_amount: z.number().min(0, 'المبلغ لا يمكن أن يكون سالباً').optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.start_date && data.expiry_date) {
    return new Date(data.start_date) < new Date(data.expiry_date);
  }
  return true;
}, {
  message: 'تاريخ البداية يجب أن يكون قبل تاريخ الانتهاء',
  path: ['expiry_date'],
});

type InsuranceFormData = z.infer<typeof insuranceSchema>;

interface VehicleInsuranceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsuranceFormData) => Promise<void>;
  insurance?: VehicleInsurance | null;
  loading?: boolean;
}

export const VehicleInsuranceForm: React.FC<VehicleInsuranceFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  insurance,
  loading = false
}) => {
  const form = useForm<InsuranceFormData>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      insurance_type: insurance?.insurance_type || 'comprehensive',
      insurance_company: insurance?.insurance_company || '',
      policy_number: insurance?.policy_number || '',
      start_date: insurance?.start_date || '',
      expiry_date: insurance?.expiry_date || '',
      premium_amount: insurance?.premium_amount || 0,
      coverage_amount: insurance?.coverage_amount || 0,
      deductible_amount: insurance?.deductible_amount || 0,
      is_active: insurance?.is_active ?? true,
      notes: insurance?.notes || '',
    },
  });

  const handleSubmit = async (data: InsuranceFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('خطأ في حفظ التأمين:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-primary">
            <Shield className="w-5 h-5" />
            {insurance ? 'تعديل التأمين' : 'إضافة تأمين جديد'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* نوع التأمين */}
              <FormField
                control={form.control}
                name="insurance_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">نوع التأمين *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-background/60 border-border/60">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="اختر نوع التأمين" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INSURANCE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.labelAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* شركة التأمين */}
              <FormField
                control={form.control}
                name="insurance_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">شركة التأمين</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Shield className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="مثال: التعاونية للتأمين" 
                          className="h-12 pr-10 bg-background/60 border-border/60"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* رقم الوثيقة */}
              <FormField
                control={form.control}
                name="policy_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">رقم الوثيقة</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="رقم وثيقة التأمين" 
                          className="h-12 pr-10 bg-background/60 border-border/60"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* تاريخ البداية */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">تاريخ البداية</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="date" 
                          className="h-12 pr-10 bg-background/60 border-border/60"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* تاريخ الانتهاء */}
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">تاريخ الانتهاء</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="date" 
                          className="h-12 pr-10 bg-background/60 border-border/60"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* قسط التأمين */}
              <FormField
                control={form.control}
                name="premium_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">قسط التأمين (د.ك)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          step="0.001"
                          min="0"
                          placeholder="0.000" 
                          className="h-12 pr-10 bg-background/60 border-border/60"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || ''}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* مبلغ التغطية */}
              <FormField
                control={form.control}
                name="coverage_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">مبلغ التغطية (د.ك)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          step="0.001"
                          min="0"
                          placeholder="0.000" 
                          className="h-12 pr-10 bg-background/60 border-border/60"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || ''}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* مبلغ التحمل */}
              <FormField
                control={form.control}
                name="deductible_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">مبلغ التحمل (د.ك)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          step="0.001"
                          min="0"
                          placeholder="0.000" 
                          className="h-12 pr-10 bg-background/60 border-border/60"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || ''}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* تفعيل التأمين */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">تفعيل التأمين</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      تحديد ما إذا كان هذا التأمين نشطاً أم لا
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* الملاحظات */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أي ملاحظات إضافية حول التأمين..."
                      className="min-h-[100px] bg-background/60 border-border/60"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* أزرار الحفظ والإلغاء */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الحفظ...' : insurance ? 'تحديث' : 'حفظ'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};